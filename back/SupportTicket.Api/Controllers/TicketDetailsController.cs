using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace SupportTicket.Api.Controllers;

[ApiController]
[Route("api/ticket-details")]
public class TicketDetailsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TicketDetailsController> _logger;

    public TicketDetailsController(
        IConfiguration configuration,
        ILogger<TicketDetailsController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public class TicketDetailsDto
    {
        public long Id { get; set; }
        public long TicketNumber { get; set; }

        public string StatusCode { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;

        public string PriorityCode { get; set; } = string.Empty;
        public string PriorityName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public long CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;

        public long? AssignedAgentId { get; set; }
        public string AssignedAgentName { get; set; } = string.Empty;

        public long? ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductCategory { get; set; } = string.Empty;
        public decimal? ProductPrice { get; set; }
        public string ProductImageUrl { get; set; } = string.Empty;

        public string Subject { get; set; } = string.Empty;

        public int? CustomerRating { get; set; }
        public string CustomerRatingComment { get; set; } = string.Empty;

        public List<TicketMessageDto> Replies { get; set; } = new();
    }

    public class TicketMessageDto
    {
        public long Id { get; set; }
        public long SenderUserId { get; set; }
        public string AuthorType { get; set; } = string.Empty; /* customer | agent */
        public string AuthorName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AddTicketReplyRequest
    {
        public long ViewerUserId { get; set; }
        public string ViewerType { get; set; } = string.Empty; /* customer | agent */
        public string Message { get; set; } = string.Empty;
    }

    public class UpdateTicketPriorityRequest
    {
        public long ViewerUserId { get; set; }
        public string ViewerType { get; set; } = string.Empty; /* must be agent */
        public string PriorityCode { get; set; } = string.Empty; /* low | medium | high | urgent */
    }

    public class UpdateTicketStatusRequest
    {
        public long ViewerUserId { get; set; }
        public string ViewerType { get; set; } = string.Empty; /* must be agent */
        public string StatusCode { get; set; } = string.Empty; /* open | in_progress | waiting_customer | resolved | closed */
        public string Note { get; set; } = string.Empty;
    }

    public class CloseTicketRequest
    {
        public long ViewerUserId { get; set; }
        public string ViewerType { get; set; } = string.Empty; /* customer | agent */
        public int? Rating { get; set; } /* required for customer close */
        public string RatingComment { get; set; } = string.Empty;
    }

    public class TicketActionResultDto
    {
        public long TicketId { get; set; }
        public long TicketNumber { get; set; }
        public string StatusCode { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public string PriorityCode { get; set; } = string.Empty;
        public string PriorityName { get; set; } = string.Empty;
    }

    private string GetConnectionString()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Missing connection string: DefaultConnection");

        return connectionString;
    }

    private static string NormalizeViewerType(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsAllowedViewerType(string viewerType)
    {
        return viewerType == "customer" || viewerType == "agent";
    }

    private static bool IsAllowedPriorityCode(string priorityCode)
    {
        return priorityCode == "low"
            || priorityCode == "medium"
            || priorityCode == "high"
            || priorityCode == "urgent";
    }

    private static bool IsAllowedStatusCode(string statusCode)
    {
        return statusCode == "open"
            || statusCode == "in_progress"
            || statusCode == "waiting_customer"
            || statusCode == "resolved"
            || statusCode == "closed";
    }

    private static bool IsAllowedManualAgentTransition(string currentStatusCode, string nextStatusCode)
    {
        if (currentStatusCode == nextStatusCode)
            return true;

        return currentStatusCode switch
        {
            "open" => nextStatusCode == "in_progress" || nextStatusCode == "waiting_customer" || nextStatusCode == "closed",
            "in_progress" => nextStatusCode == "waiting_customer" || nextStatusCode == "closed",
            "waiting_customer" => nextStatusCode == "in_progress" || nextStatusCode == "closed",
            _ => false
        };
    }

    private sealed class TicketAccessRow
    {
        public long TicketId { get; set; }
        public long TicketNumber { get; set; }
        public long CustomerId { get; set; }
        public long? AssignedAgentId { get; set; }
        public short StatusId { get; set; }
        public string StatusCode { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public short PriorityId { get; set; }
        public string PriorityCode { get; set; } = string.Empty;
        public string PriorityName { get; set; } = string.Empty;
        public DateTime? FirstResponseAt { get; set; }
    }

    private async Task<TicketAccessRow?> GetAccessibleTicketAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction? transaction,
        long ticketId,
        long viewerUserId,
        string viewerType)
    {
        const string sql = @"
            SELECT
                t.id,
                t.ticket_number,
                t.customer_id,
                t.assigned_agent_id,
                st.id,
                st.code,
                st.name,
                pr.id,
                pr.code,
                pr.name,
                t.first_response_at
            FROM tickets t
            INNER JOIN ticket_statuses st ON st.id = t.status_id
            INNER JOIN ticket_priorities pr ON pr.id = t.priority_id
            WHERE t.id = @ticket_id
              AND (
                    (@viewer_type = 'customer' AND t.customer_id = @viewer_user_id)
                 OR (@viewer_type = 'agent' AND t.assigned_agent_id = @viewer_user_id)
              )
            LIMIT 1;
        ";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("ticket_id", ticketId);
        cmd.Parameters.AddWithValue("viewer_user_id", viewerUserId);
        cmd.Parameters.AddWithValue("viewer_type", viewerType);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return new TicketAccessRow
        {
            TicketId = reader.GetInt64(0),
            TicketNumber = reader.GetInt64(1),
            CustomerId = reader.GetInt64(2),
            AssignedAgentId = reader.IsDBNull(3) ? null : reader.GetInt64(3),
            StatusId = reader.GetInt16(4),
            StatusCode = reader.GetString(5),
            StatusName = reader.GetString(6),
            PriorityId = reader.GetInt16(7),
            PriorityCode = reader.GetString(8),
            PriorityName = reader.GetString(9),
            FirstResponseAt = reader.IsDBNull(10) ? null : reader.GetDateTime(10)
        };
    }

    private async Task<(short Id, string Code, string Name)?> GetStatusByCodeAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string statusCode)
    {
        const string sql = @"
            SELECT id, code, name
            FROM ticket_statuses
            WHERE code = @code
            LIMIT 1;
        ";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("code", statusCode);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return (reader.GetInt16(0), reader.GetString(1), reader.GetString(2));
    }

    private async Task<(short Id, string Code, string Name)?> GetPriorityByCodeAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string priorityCode)
    {
        const string sql = @"
            SELECT id, code, name
            FROM ticket_priorities
            WHERE code = @code
            LIMIT 1;
        ";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("code", priorityCode);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return (reader.GetInt16(0), reader.GetString(1), reader.GetString(2));
    }

    private async Task InsertStatusHistoryAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        long ticketId,
        short oldStatusId,
        short newStatusId,
        long changedByUserId,
        string note)
    {
        const string sql = @"
            INSERT INTO ticket_status_history (
                ticket_id,
                old_status_id,
                new_status_id,
                changed_by_user_id,
                note
            )
            VALUES (
                @ticket_id,
                @old_status_id,
                @new_status_id,
                @changed_by_user_id,
                @note
            );
        ";

        await using var cmd = new NpgsqlCommand(sql, connection, transaction);
        cmd.Parameters.AddWithValue("ticket_id", ticketId);
        cmd.Parameters.AddWithValue("old_status_id", oldStatusId);
        cmd.Parameters.AddWithValue("new_status_id", newStatusId);
        cmd.Parameters.AddWithValue("changed_by_user_id", changedByUserId);
        cmd.Parameters.AddWithValue("note", note ?? string.Empty);

        await cmd.ExecuteNonQueryAsync();
    }

    [HttpGet("{ticketId:long}")]
public async Task<IActionResult> GetTicketDetails(
    long ticketId,
    [FromQuery] long? viewerUserId,
    [FromQuery] string? viewerType)
{
    var normalizedViewerType = NormalizeViewerType(viewerType);
    var isViewerMode =
        !viewerUserId.HasValue ||
        viewerUserId.Value <= 0 ||
        string.IsNullOrWhiteSpace(normalizedViewerType);

    if (!isViewerMode && !IsAllowedViewerType(normalizedViewerType))
        return BadRequest("viewerType must be 'customer' or 'agent'.");

    try
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        var sql = isViewerMode
            ? @"
                SELECT
                    t.id,
                    t.ticket_number,

                    st.code AS status_code,
                    st.name AS status_name,

                    pr.code AS priority_code,
                    pr.name AS priority_name,

                    t.created_at,

                    c.id AS customer_id,
                    c.full_name AS customer_name,
                    c.email AS customer_email,

                    a.id AS assigned_agent_id,
                    COALESCE(a.full_name, '') AS assigned_agent_name,

                    p.id AS product_id,
                    COALESCE(p.name, '') AS product_name,
                    COALESCE(pc.name, '') AS product_category,
                    p.price,
                    COALESCE(p.primary_image_url, '') AS product_image_url,

                    t.subject,
                    t.customer_rating,
                    COALESCE(t.customer_rating_comment, '') AS customer_rating_comment
                FROM tickets t
                INNER JOIN ticket_statuses st ON st.id = t.status_id
                INNER JOIN ticket_priorities pr ON pr.id = t.priority_id
                INNER JOIN users c ON c.id = t.customer_id
                LEFT JOIN users a ON a.id = t.assigned_agent_id
                LEFT JOIN products p ON p.id = t.product_id
                LEFT JOIN product_categories pc ON pc.id = p.category_id
                WHERE t.id = @ticket_id
                LIMIT 1;
            "
            : @"
                SELECT
                    t.id,
                    t.ticket_number,

                    st.code AS status_code,
                    st.name AS status_name,

                    pr.code AS priority_code,
                    pr.name AS priority_name,

                    t.created_at,

                    c.id AS customer_id,
                    c.full_name AS customer_name,
                    c.email AS customer_email,

                    a.id AS assigned_agent_id,
                    COALESCE(a.full_name, '') AS assigned_agent_name,

                    p.id AS product_id,
                    COALESCE(p.name, '') AS product_name,
                    COALESCE(pc.name, '') AS product_category,
                    p.price,
                    COALESCE(p.primary_image_url, '') AS product_image_url,

                    t.subject,
                    t.customer_rating,
                    COALESCE(t.customer_rating_comment, '') AS customer_rating_comment
                FROM tickets t
                INNER JOIN ticket_statuses st ON st.id = t.status_id
                INNER JOIN ticket_priorities pr ON pr.id = t.priority_id
                INNER JOIN users c ON c.id = t.customer_id
                LEFT JOIN users a ON a.id = t.assigned_agent_id
                LEFT JOIN products p ON p.id = t.product_id
                LEFT JOIN product_categories pc ON pc.id = p.category_id
                WHERE t.id = @ticket_id
                  AND (
                        (@viewer_type = 'customer' AND t.customer_id = @viewer_user_id)
                     OR (@viewer_type = 'agent' AND t.assigned_agent_id = @viewer_user_id)
                  )
                LIMIT 1;
            ";

        TicketDetailsDto? result = null;

        await using (var cmd = new NpgsqlCommand(sql, connection))
        {
            cmd.Parameters.AddWithValue("ticket_id", ticketId);

            if (!isViewerMode)
            {
                cmd.Parameters.AddWithValue("viewer_user_id", viewerUserId!.Value);
                cmd.Parameters.AddWithValue("viewer_type", normalizedViewerType);
            }

            await using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                result = new TicketDetailsDto
                {
                    Id = reader.GetInt64(0),
                    TicketNumber = reader.GetInt64(1),

                    StatusCode = reader.GetString(2),
                    StatusName = reader.GetString(3),

                    PriorityCode = reader.GetString(4),
                    PriorityName = reader.GetString(5),

                    CreatedAt = reader.GetDateTime(6),

                    CustomerId = reader.GetInt64(7),
                    CustomerName = reader.GetString(8),
                    CustomerEmail = reader.GetString(9),

                    AssignedAgentId = reader.IsDBNull(10) ? null : reader.GetInt64(10),
                    AssignedAgentName = reader.GetString(11),

                    ProductId = reader.IsDBNull(12) ? null : reader.GetInt64(12),
                    ProductName = reader.GetString(13),
                    ProductCategory = reader.GetString(14),
                    ProductPrice = reader.IsDBNull(15) ? null : reader.GetDecimal(15),
                    ProductImageUrl = reader.GetString(16),

                    Subject = reader.GetString(17),

                    CustomerRating = reader.IsDBNull(18) ? null : (int)reader.GetInt16(18),
                    CustomerRatingComment = reader.GetString(19)
                };
            }
        }

        if (result == null)
            return NotFound(isViewerMode
                ? "Ticket not found."
                : "Ticket not found for this viewer.");

        const string messagesSql = @"
            SELECT
                tm.id,
                tm.sender_user_id,
                CASE
                    WHEN ur.code = 'agent' THEN 'agent'
                    ELSE 'customer'
                END AS author_type,
                u.full_name,
                tm.message_body,
                tm.created_at
            FROM ticket_messages tm
            INNER JOIN users u ON u.id = tm.sender_user_id
            INNER JOIN user_roles ur ON ur.id = u.role_id
            WHERE tm.ticket_id = @ticket_id
              AND tm.is_internal_note = FALSE
            ORDER BY tm.created_at ASC, tm.id ASC;
        ";

        await using (var cmd = new NpgsqlCommand(messagesSql, connection))
        {
            cmd.Parameters.AddWithValue("ticket_id", ticketId);

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                result.Replies.Add(new TicketMessageDto
                {
                    Id = reader.GetInt64(0),
                    SenderUserId = reader.GetInt64(1),
                    AuthorType = reader.GetString(2),
                    AuthorName = reader.GetString(3),
                    Message = reader.GetString(4),
                    CreatedAt = reader.GetDateTime(5)
                });
            }
        }

        return Ok(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to load ticket details for ticketId={TicketId}", ticketId);
        return StatusCode(500, ex.ToString());
    }
}

    [HttpPost("{ticketId:long}/replies")]
    public async Task<IActionResult> AddReply(long ticketId, [FromBody] AddTicketReplyRequest request)
    {
        request.ViewerType = NormalizeViewerType(request.ViewerType);

        if (request.ViewerUserId <= 0)
            return BadRequest("ViewerUserId is required.");

        if (!IsAllowedViewerType(request.ViewerType))
            return BadRequest("ViewerType must be 'customer' or 'agent'.");

        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest("Message is required.");

        try
        {
            await using var connection = new NpgsqlConnection(GetConnectionString());
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            var ticket = await GetAccessibleTicketAsync(
                connection,
                transaction,
                ticketId,
                request.ViewerUserId,
                request.ViewerType);

            if (ticket == null)
                return NotFound("Ticket not found for this viewer.");

            if (ticket.StatusCode == "resolved" || ticket.StatusCode == "closed")
                return BadRequest("Cannot reply to a resolved or closed ticket.");

            const string insertMessageSql = @"
                INSERT INTO ticket_messages (
                    ticket_id,
                    sender_user_id,
                    message_body,
                    is_internal_note
                )
                VALUES (
                    @ticket_id,
                    @sender_user_id,
                    @message_body,
                    FALSE
                )
                RETURNING id;
            ";

            long newMessageId;

            await using (var cmd = new NpgsqlCommand(insertMessageSql, connection, transaction))
            {
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                cmd.Parameters.AddWithValue("sender_user_id", request.ViewerUserId);
                cmd.Parameters.AddWithValue("message_body", request.Message.Trim());

                var scalar = await cmd.ExecuteScalarAsync();

                if (scalar == null)
                    return StatusCode(500, "Failed to insert reply.");

                newMessageId = Convert.ToInt64(scalar);
            }

            const string touchParticipantSql = @"
                UPDATE ticket_participants
                SET
                    last_read_message_id = @message_id,
                    last_read_at = NOW()
                WHERE ticket_id = @ticket_id
                  AND user_id = @user_id;
            ";

            await using (var cmd = new NpgsqlCommand(touchParticipantSql, connection, transaction))
            {
                cmd.Parameters.AddWithValue("message_id", newMessageId);
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                cmd.Parameters.AddWithValue("user_id", request.ViewerUserId);
                await cmd.ExecuteNonQueryAsync();
            }

            string nextStatusCode = request.ViewerType == "agent"
                ? "waiting_customer"
                : "in_progress";

            var nextStatus = await GetStatusByCodeAsync(connection, transaction, nextStatusCode);

            if (nextStatus == null)
                return StatusCode(500, $"Missing seed data: ticket_statuses.{nextStatusCode}");

            const string updateTicketSql = @"
                UPDATE tickets
                SET
                    status_id = @status_id,
                    last_message_at = NOW(),
                    first_response_at = CASE
                        WHEN @viewer_type = 'agent' AND first_response_at IS NULL THEN NOW()
                        ELSE first_response_at
                    END
                WHERE id = @ticket_id;
            ";

            await using (var cmd = new NpgsqlCommand(updateTicketSql, connection, transaction))
            {
                cmd.Parameters.AddWithValue("status_id", nextStatus.Value.Id);
                cmd.Parameters.AddWithValue("viewer_type", request.ViewerType);
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                await cmd.ExecuteNonQueryAsync();
            }

            if (ticket.StatusId != nextStatus.Value.Id)
            {
                await InsertStatusHistoryAsync(
                    connection,
                    transaction,
                    ticketId,
                    ticket.StatusId,
                    nextStatus.Value.Id,
                    request.ViewerUserId,
                    request.ViewerType == "agent"
                        ? "Agent replied - moved to Waiting Customer"
                        : "Customer replied - moved to In Progress");
            }

            await transaction.CommitAsync();

            return Ok(new TicketActionResultDto
            {
                TicketId = ticket.TicketId,
                TicketNumber = ticket.TicketNumber,
                StatusCode = nextStatus.Value.Code,
                StatusName = nextStatus.Value.Name,
                PriorityCode = ticket.PriorityCode,
                PriorityName = ticket.PriorityName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add reply for ticketId={TicketId}", ticketId);
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpPatch("{ticketId:long}/priority")]
    public async Task<IActionResult> UpdatePriority(long ticketId, [FromBody] UpdateTicketPriorityRequest request)
    {
        request.ViewerType = NormalizeViewerType(request.ViewerType);
        request.PriorityCode = (request.PriorityCode ?? string.Empty).Trim().ToLowerInvariant();

        if (request.ViewerUserId <= 0)
            return BadRequest("ViewerUserId is required.");

        if (request.ViewerType != "agent")
            return BadRequest("Only agent can update priority.");

        if (!IsAllowedPriorityCode(request.PriorityCode))
            return BadRequest("PriorityCode is invalid.");

        try
        {
            await using var connection = new NpgsqlConnection(GetConnectionString());
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            var ticket = await GetAccessibleTicketAsync(
                connection,
                transaction,
                ticketId,
                request.ViewerUserId,
                request.ViewerType);

            if (ticket == null)
                return NotFound("Ticket not found for this viewer.");

            var priority = await GetPriorityByCodeAsync(connection, transaction, request.PriorityCode);

            if (priority == null)
                return StatusCode(500, $"Missing seed data: ticket_priorities.{request.PriorityCode}");

            const string sql = @"
                UPDATE tickets
                SET priority_id = @priority_id
                WHERE id = @ticket_id;
            ";

            await using (var cmd = new NpgsqlCommand(sql, connection, transaction))
            {
                cmd.Parameters.AddWithValue("priority_id", priority.Value.Id);
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                await cmd.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            return Ok(new TicketActionResultDto
            {
                TicketId = ticket.TicketId,
                TicketNumber = ticket.TicketNumber,
                StatusCode = ticket.StatusCode,
                StatusName = ticket.StatusName,
                PriorityCode = priority.Value.Code,
                PriorityName = priority.Value.Name
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update priority for ticketId={TicketId}", ticketId);
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpPatch("{ticketId:long}/status")]
    public async Task<IActionResult> UpdateStatus(long ticketId, [FromBody] UpdateTicketStatusRequest request)
    {
        request.ViewerType = NormalizeViewerType(request.ViewerType);
        request.StatusCode = (request.StatusCode ?? string.Empty).Trim().ToLowerInvariant();

        if (request.ViewerUserId <= 0)
            return BadRequest("ViewerUserId is required.");

        if (request.ViewerType != "agent")
            return BadRequest("Only agent can update status manually.");

        if (!IsAllowedStatusCode(request.StatusCode))
            return BadRequest("StatusCode is invalid.");

        try
        {
            await using var connection = new NpgsqlConnection(GetConnectionString());
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            var ticket = await GetAccessibleTicketAsync(
                connection,
                transaction,
                ticketId,
                request.ViewerUserId,
                request.ViewerType);

            if (ticket == null)
                return NotFound("Ticket not found for this viewer.");

            if (!IsAllowedManualAgentTransition(ticket.StatusCode, request.StatusCode))
            {
                return BadRequest(
                    $"Manual transition from '{ticket.StatusCode}' to '{request.StatusCode}' is not allowed.");
            }

            var nextStatus = await GetStatusByCodeAsync(connection, transaction, request.StatusCode);

            if (nextStatus == null)
                return StatusCode(500, $"Missing seed data: ticket_statuses.{request.StatusCode}");

            const string sql = @"
                UPDATE tickets
                SET
                    status_id = @status_id,
                    closed_at = CASE
                        WHEN @status_code = 'closed' THEN NOW()
                        ELSE closed_at
                    END,
                    resolved_at = CASE
                        WHEN @status_code = 'resolved' THEN NOW()
                        ELSE resolved_at
                    END
                WHERE id = @ticket_id;
            ";

            await using (var cmd = new NpgsqlCommand(sql, connection, transaction))
            {
                cmd.Parameters.AddWithValue("status_id", nextStatus.Value.Id);
                cmd.Parameters.AddWithValue("status_code", nextStatus.Value.Code);
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                await cmd.ExecuteNonQueryAsync();
            }

            if (ticket.StatusId != nextStatus.Value.Id)
            {
                await InsertStatusHistoryAsync(
                    connection,
                    transaction,
                    ticketId,
                    ticket.StatusId,
                    nextStatus.Value.Id,
                    request.ViewerUserId,
                    string.IsNullOrWhiteSpace(request.Note)
                        ? $"Agent manually changed status to {nextStatus.Value.Name}"
                        : request.Note.Trim());
            }

            await transaction.CommitAsync();

            return Ok(new TicketActionResultDto
            {
                TicketId = ticket.TicketId,
                TicketNumber = ticket.TicketNumber,
                StatusCode = nextStatus.Value.Code,
                StatusName = nextStatus.Value.Name,
                PriorityCode = ticket.PriorityCode,
                PriorityName = ticket.PriorityName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update status for ticketId={TicketId}", ticketId);
            return StatusCode(500, ex.ToString());
        }
    }

    [HttpPost("{ticketId:long}/close")]
    public async Task<IActionResult> CloseTicket(long ticketId, [FromBody] CloseTicketRequest request)
    {
        request.ViewerType = NormalizeViewerType(request.ViewerType);

        if (request.ViewerUserId <= 0)
            return BadRequest("ViewerUserId is required.");

        if (!IsAllowedViewerType(request.ViewerType))
            return BadRequest("ViewerType must be 'customer' or 'agent'.");

        if (request.ViewerType == "customer")
        {
            if (!request.Rating.HasValue || request.Rating.Value < 1 || request.Rating.Value > 5)
                return BadRequest("Customer close requires rating between 1 and 5.");
        }

        try
        {
            await using var connection = new NpgsqlConnection(GetConnectionString());
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            var ticket = await GetAccessibleTicketAsync(
                connection,
                transaction,
                ticketId,
                request.ViewerUserId,
                request.ViewerType);

            if (ticket == null)
                return NotFound("Ticket not found for this viewer.");

            var nextStatusCode = request.ViewerType == "agent" ? "closed" : "resolved";

            var nextStatus = await GetStatusByCodeAsync(connection, transaction, nextStatusCode);

            if (nextStatus == null)
                return StatusCode(500, $"Missing seed data: ticket_statuses.{nextStatusCode}");

            if (request.ViewerType == "agent")
            {
                const string sql = @"
                    UPDATE tickets
                    SET
                        status_id = @status_id,
                        closed_at = NOW()
                    WHERE id = @ticket_id;
                ";

                await using var cmd = new NpgsqlCommand(sql, connection, transaction);
                cmd.Parameters.AddWithValue("status_id", nextStatus.Value.Id);
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                await cmd.ExecuteNonQueryAsync();
            }
            else
            {
                const string sql = @"
                    UPDATE tickets
                    SET
                        status_id = @status_id,
                        resolved_at = NOW(),
                        customer_rating = @customer_rating,
                        customer_rating_comment = @customer_rating_comment
                    WHERE id = @ticket_id;
                ";

                await using var cmd = new NpgsqlCommand(sql, connection, transaction);
                cmd.Parameters.AddWithValue("status_id", nextStatus.Value.Id);
                cmd.Parameters.AddWithValue("customer_rating", request.Rating!.Value);
                cmd.Parameters.AddWithValue("customer_rating_comment", request.RatingComment?.Trim() ?? string.Empty);
                cmd.Parameters.AddWithValue("ticket_id", ticketId);
                await cmd.ExecuteNonQueryAsync();
            }

            if (ticket.StatusId != nextStatus.Value.Id)
            {
                await InsertStatusHistoryAsync(
                    connection,
                    transaction,
                    ticketId,
                    ticket.StatusId,
                    nextStatus.Value.Id,
                    request.ViewerUserId,
                    request.ViewerType == "agent"
                        ? "Agent closed the ticket"
                        : "Customer resolved the ticket and submitted rating");
            }

            await transaction.CommitAsync();

            return Ok(new TicketActionResultDto
            {
                TicketId = ticket.TicketId,
                TicketNumber = ticket.TicketNumber,
                StatusCode = nextStatus.Value.Code,
                StatusName = nextStatus.Value.Name,
                PriorityCode = ticket.PriorityCode,
                PriorityName = ticket.PriorityName
            });
        }
        catch (PostgresException ex) when (ex.SqlState == "42703")
        {
            _logger.LogError(ex, "Ticket rating schema is out of date.");
            return StatusCode(
                500,
                "Ticket rating schema is out of date. Apply the database schema updates and retry.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to close ticketId={TicketId}", ticketId);
            return StatusCode(500, ex.ToString());
        }
    }
}
