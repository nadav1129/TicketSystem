using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace SupportTicket.Api.Controllers;

[ApiController]
[Route("api/tickets")]
public class TicketsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(
        IConfiguration configuration,
        ILogger<TicketsController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public class CreateTicketRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public short IssueTypeId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public CreateTicketProductRequest Product { get; set; } = new();
    }

    public class CreateTicketProductRequest
    {
        public long ExternalId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }
    public class TicketListItemResponse
    {
        public long Id { get; set; }
        public long TicketNumber { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string RequesterName { get; set; } = string.Empty;
        public string AssignedAgentName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class MyTicketsUserDto
{
    public long Id { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string RoleLabel { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class MyTicketsItemDto
{
    public long Id { get; set; }
    public long TicketNumber { get; set; }
    public string Product { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public bool Unread { get; set; }
    public string? Customer { get; set; }
}

public class MyTicketsResponseDto
{
    public long UserId { get; set; }
    public string ViewerType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string RoleLabel { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int OpenTickets { get; set; }
    public int TotalTickets { get; set; }
    public int WaitingReplies { get; set; }
    public int ResolvedThisMonth { get; set; }
    public string AverageResolution { get; set; } = "—";
    public List<MyTicketsItemDto> Tickets { get; set; } = new();
}

private static string GetText(NpgsqlDataReader reader, int ordinal, string fallback = "")
{
    if (reader.IsDBNull(ordinal))
        return fallback;

    var value = reader.GetString(ordinal).Trim();
    return string.IsNullOrWhiteSpace(value) ? fallback : value;
}

[HttpGet("my-tickets/users")]
public async Task<IActionResult> GetMyTicketsUsers([FromQuery] string role)
{
    var connectionString = _configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
        return StatusCode(500, "Missing connection string: DefaultConnection");

    role = (role ?? string.Empty).Trim().ToLowerInvariant();

    if (role != "customer" && role != "agent")
        return BadRequest("role must be 'customer' or 'agent'.");

    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    const string sql = @"
        SELECT
            u.id,
            r.code,
            r.name,
            u.full_name,
            u.email,
            COALESCE(u.phone, '') AS phone
        FROM users u
        INNER JOIN user_roles r ON r.id = u.role_id
        WHERE r.code = @role
          AND u.is_active = TRUE
        ORDER BY u.full_name;
    ";

    var result = new List<MyTicketsUserDto>();

    await using var cmd = new NpgsqlCommand(sql, connection);
    cmd.Parameters.AddWithValue("role", role);

    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        result.Add(new MyTicketsUserDto
        {
            Id = reader.GetInt64(0),
            RoleCode = reader.GetString(1),
            RoleLabel = reader.GetString(2),
            Name = reader.GetString(3),
            Email = reader.GetString(4),
            Phone = reader.GetString(5)
        });
    }

    return Ok(result);
}

[HttpGet("my-tickets/{viewerType}/{userId:long}")]
public async Task<IActionResult> GetMyTickets(string viewerType, long userId)
{
    var connectionString = _configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
        return StatusCode(500, "Missing connection string: DefaultConnection");

    viewerType = (viewerType ?? string.Empty).Trim().ToLowerInvariant();

    if (viewerType != "customer" && viewerType != "agent")
        return BadRequest("viewerType must be 'customer' or 'agent'.");

    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    var profileSql = viewerType == "customer"
        ? @"
            SELECT
                u.id,
                u.full_name,
                r.name,
                'Customer account' AS subtitle,
                u.email,
                COALESCE(u.phone, '') AS phone,
                COUNT(t.id) FILTER (WHERE st.is_closed = FALSE) AS open_tickets,
                COUNT(t.id) AS total_tickets,
                COUNT(t.id) FILTER (WHERE st.code = 'waiting_customer') AS waiting_replies,
                COUNT(t.id) FILTER (
                    WHERE st.code = 'resolved'
                    AND t.updated_at >= date_trunc('month', now())
                ) AS resolved_this_month
            FROM users u
            INNER JOIN user_roles r ON r.id = u.role_id
            LEFT JOIN tickets t ON t.customer_id = u.id
            LEFT JOIN ticket_statuses st ON st.id = t.status_id
            WHERE u.id = @user_id AND r.code = 'customer'
            GROUP BY u.id, u.full_name, r.name, u.email, u.phone;
        "
        : @"
            SELECT
                u.id,
                u.full_name,
                r.name,
                'Support agent workspace' AS subtitle,
                u.email,
                COALESCE(u.phone, '') AS phone,
                COUNT(t.id) FILTER (WHERE st.is_closed = FALSE) AS open_tickets,
                COUNT(t.id) AS total_tickets,
                COUNT(t.id) FILTER (WHERE st.code = 'waiting_customer') AS waiting_replies,
                COUNT(t.id) FILTER (
                    WHERE st.code = 'resolved'
                    AND t.updated_at >= date_trunc('month', now())
                ) AS resolved_this_month
            FROM users u
            INNER JOIN user_roles r ON r.id = u.role_id
            LEFT JOIN tickets t ON t.assigned_agent_id = u.id
            LEFT JOIN ticket_statuses st ON st.id = t.status_id
            WHERE u.id = @user_id AND r.code = 'agent'
            GROUP BY u.id, u.full_name, r.name, u.email, u.phone;
        ";

    MyTicketsResponseDto? response = null;

    await using (var cmd = new NpgsqlCommand(profileSql, connection))
    {
        cmd.Parameters.AddWithValue("user_id", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            response = new MyTicketsResponseDto
            {
                UserId = reader.GetInt64(0),
                Name = reader.GetString(1),
                RoleLabel = reader.GetString(2),
                ViewerType = viewerType,
                Subtitle = reader.GetString(3),
                Email = reader.GetString(4),
                Phone = reader.GetString(5),
                OpenTickets = reader.GetInt32(6),
                TotalTickets = reader.GetInt32(7),
                WaitingReplies = reader.GetInt32(8),
                ResolvedThisMonth = reader.GetInt32(9),
                AverageResolution = "Tracked live"
            };
        }
    }

    if (response == null)
        return NotFound("User not found for requested viewer type.");

    var ticketsSql = viewerType == "customer"
        ? @"
            SELECT
                t.id,
                t.ticket_number,
                COALESCE(p.name, '') AS product_name,
                COALESCE(st.name, '') AS status_name,
                COALESCE(pr.name, '') AS priority_name,
                to_char(t.created_at, 'YYYY-MM-DD') AS created_date,
                COALESCE(LEFT(p.name, 2), 'NA') AS image_text,
                FALSE AS unread,
                NULL::text AS customer_name
            FROM tickets t
            LEFT JOIN products p ON p.id = t.product_id
            LEFT JOIN ticket_statuses st ON st.id = t.status_id
            LEFT JOIN ticket_priorities pr ON pr.id = t.priority_id
            WHERE t.customer_id = @user_id
            ORDER BY t.created_at DESC, t.id DESC;
        "
        : @"
            SELECT
                t.id,
                t.ticket_number,
                COALESCE(p.name, '') AS product_name,
                COALESCE(st.name, '') AS status_name,
                COALESCE(pr.name, '') AS priority_name,
                to_char(t.created_at, 'YYYY-MM-DD') AS created_date,
                COALESCE(LEFT(p.name, 2), 'NA') AS image_text,
                FALSE AS unread,
                COALESCE(c.full_name, '') AS customer_name
            FROM tickets t
            LEFT JOIN products p ON p.id = t.product_id
            LEFT JOIN ticket_statuses st ON st.id = t.status_id
            LEFT JOIN ticket_priorities pr ON pr.id = t.priority_id
            LEFT JOIN users c ON c.id = t.customer_id
            WHERE t.assigned_agent_id = @user_id
            ORDER BY t.created_at DESC, t.id DESC;
        ";

    await using (var cmd = new NpgsqlCommand(ticketsSql, connection))
    {
        cmd.Parameters.AddWithValue("user_id", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            response.Tickets.Add(new MyTicketsItemDto
            {
                Id = reader.GetInt64(0),
                TicketNumber = reader.GetInt64(1),
                Product = reader.GetString(2),
                Status = reader.GetString(3),
                Priority = reader.GetString(4),
                Date = reader.GetString(5),
                Image = reader.GetString(6).ToUpperInvariant(),
                Unread = reader.GetBoolean(7),
                Customer = reader.IsDBNull(8) ? null : reader.GetString(8)
            });
        }
    }

    return Ok(response);
}


     [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
            return StatusCode(500, "Missing connection string: DefaultConnection");

        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            const string sql = @"
                SELECT
                    t.id,
                    t.ticket_number,
                    COALESCE(NULLIF(TRIM(t.subject), ''), '(No subject)') AS subject,
                    COALESCE(NULLIF(TRIM(c.full_name), ''), 'Unknown requester') AS requester_name,
                    COALESCE(NULLIF(TRIM(a.full_name), ''), 'Unassigned') AS assigned_agent_name,
                    COALESCE(NULLIF(TRIM(p.name), ''), 'Unknown product') AS product_name,
                    COALESCE(NULLIF(TRIM(ch.name), ''), INITCAP(REPLACE(COALESCE(ch.code, 'unknown'), '_', ' '))) AS channel_name,
                    COALESCE(NULLIF(TRIM(pr.name), ''), INITCAP(REPLACE(COALESCE(pr.code, 'unknown'), '_', ' '))) AS priority_name,
                    COALESCE(NULLIF(TRIM(st.name), ''), INITCAP(REPLACE(COALESCE(st.code, 'unknown'), '_', ' '))) AS status_name,
                    t.created_at
                FROM tickets t
                LEFT JOIN users c ON c.id = t.customer_id
                LEFT JOIN users a ON a.id = t.assigned_agent_id
                LEFT JOIN products p ON p.id = t.product_id
                LEFT JOIN ticket_channels ch ON ch.id = t.channel_id
                LEFT JOIN ticket_priorities pr ON pr.id = t.priority_id
                LEFT JOIN ticket_statuses st ON st.id = t.status_id
                ORDER BY t.created_at DESC, t.id DESC;
            ";

            var tickets = new List<TicketListItemResponse>();

            await using var cmd = new NpgsqlCommand(sql, connection);
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                tickets.Add(new TicketListItemResponse
                {
                    Id = reader.GetInt64(0),
                    TicketNumber = reader.GetInt64(1),
                    Subject = GetText(reader, 2, "(No subject)"),
                    RequesterName = GetText(reader, 3, "Unknown requester"),
                    AssignedAgentName = GetText(reader, 4, "Unassigned"),
                    ProductName = GetText(reader, 5, "Unknown product"),
                    Channel = GetText(reader, 6, "Unknown"),
                    Priority = GetText(reader, 7, "Unknown"),
                    Status = GetText(reader, 8, "Unknown"),
                    CreatedAt = reader.GetFieldValue<DateTime>(9)
                });
            }

            return Ok(tickets);
        }
        catch (PostgresException ex)
        {
            _logger.LogError(ex, "Failed to load ticket list. SQLSTATE: {SqlState}", ex.SqlState);
            return StatusCode(500, new
            {
                message = "Ticket list query failed.",
                sqlState = ex.SqlState,
                detail = ex.MessageText
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {   
         _logger.LogInformation(
        "Create request received. Email={Email}, Name={Name}, IssueTypeId={IssueTypeId}, Subject={Subject}, MessageLength={MessageLength}, ProductIsNull={ProductIsNull}, ProductExternalId={ProductExternalId}, ProductName={ProductName}, ProductCategory={ProductCategory}, ProductPrice={ProductPrice}, ProductImageUrl={ProductImageUrl}",
        request.Email,
        request.Name,
        request.IssueTypeId,
        request.Subject,
        request.Message?.Length ?? 0,
        request.Product == null,
        request.Product?.ExternalId ?? 0,
        request.Product?.Name,
        request.Product?.Category,
        request.Product?.Price ?? 0,
        request.Product?.ImageUrl
    );

    if (string.IsNullOrWhiteSpace(request.Email))
        return BadRequest("Email is missing.");

    if (string.IsNullOrWhiteSpace(request.Name))
        return BadRequest("Name is missing.");

    if (request.IssueTypeId <= 0)
        return BadRequest("IssueTypeId is missing or invalid.");

    if (string.IsNullOrWhiteSpace(request.Message))
        return BadRequest("Message is missing.");

    if (string.IsNullOrWhiteSpace(request.Subject))
        return BadRequest("Subject is missing.");

    if (request.Product == null)
        return BadRequest("Product is missing.");

    if (request.Product.ExternalId <= 0)
        return BadRequest("Product.ExternalId is missing or invalid.");

    if (string.IsNullOrWhiteSpace(request.Product.Name))
        return BadRequest("Product.Name is missing.");

    if (string.IsNullOrWhiteSpace(request.Product.Category))
        return BadRequest("Product.Category is missing.");

    if (request.Product.Price < 0)
        return BadRequest("Product.Price is invalid.");

    var connectionString = _configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return StatusCode(500, "Missing connection string: DefaultConnection");
    }

    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    await using var transaction = await connection.BeginTransactionAsync();

    try
    {
            long customerRoleId;
            long openStatusId;
            long mediumPriorityId;
            long webChannelId;

            await using (var cmd = new NpgsqlCommand(@"
                SELECT id FROM user_roles WHERE code = 'customer';
                SELECT id FROM ticket_statuses WHERE code = 'open';
                SELECT id FROM ticket_priorities WHERE code = 'medium';
                SELECT id FROM ticket_channels WHERE code = 'web';
            ", connection, transaction))
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync())
                    return StatusCode(500, "Missing seed data: user_roles.customer");
                customerRoleId = reader.GetInt64(0);

                if (!await reader.NextResultAsync() || !await reader.ReadAsync())
                    return StatusCode(500, "Missing seed data: ticket_statuses.open");
                openStatusId = reader.GetInt64(0);

                if (!await reader.NextResultAsync() || !await reader.ReadAsync())
                    return StatusCode(500, "Missing seed data: ticket_priorities.medium");
                mediumPriorityId = reader.GetInt64(0);

                if (!await reader.NextResultAsync() || !await reader.ReadAsync())
                    return StatusCode(500, "Missing seed data: ticket_channels.web");
                webChannelId = reader.GetInt64(0);
            }

            await using (var validateIssueTypeCmd = new NpgsqlCommand(@"
    SELECT EXISTS (
        SELECT 1
        FROM ticket_issue_types
        WHERE id = @issue_type_id
    );
", connection, transaction))
{
    validateIssueTypeCmd.Parameters.AddWithValue("issue_type_id", request.IssueTypeId);

    var issueTypeExistsObj = await validateIssueTypeCmd.ExecuteScalarAsync();
    var issueTypeExists = issueTypeExistsObj != null && Convert.ToBoolean(issueTypeExistsObj);

    if (!issueTypeExists)
        return BadRequest($"Issue type {request.IssueTypeId} does not exist in database.");
}

            long productId;

            await using (var findProductCmd = new NpgsqlCommand(@"
                SELECT id
                FROM products
                WHERE external_id = @external_id
                LIMIT 1;
            ", connection, transaction))
            {
                findProductCmd.Parameters.AddWithValue("external_id", request.Product.ExternalId);

                var existingProductId = await findProductCmd.ExecuteScalarAsync();

                if (existingProductId != null)
                {
                    productId = Convert.ToInt64(existingProductId);

                    await using var updateProductCmd = new NpgsqlCommand(@"
                        UPDATE products
                        SET
                            name = @name,
                            price = @price,
                            primary_image_url = @image_url,
                            updated_at = NOW(),
                            last_synced_at = NOW()
                        WHERE id = @id;
                    ", connection, transaction);

                    updateProductCmd.Parameters.AddWithValue("id", productId);
                    updateProductCmd.Parameters.AddWithValue("name", request.Product.Name.Trim());
                    updateProductCmd.Parameters.AddWithValue("price", request.Product.Price);
                    updateProductCmd.Parameters.AddWithValue("image_url", request.Product.ImageUrl ?? string.Empty);

                    await updateProductCmd.ExecuteNonQueryAsync();
                }
                else
                {
                    await using var insertProductCmd = new NpgsqlCommand(@"
                        INSERT INTO products (
                            external_id,
                            source_name,
                            name,
                            price,
                            primary_image_url,
                            is_active,
                            created_at,
                            updated_at,
                            last_synced_at
                        )
                        VALUES (
                            @external_id,
                            'platzi_fake_store',
                            @name,
                            @price,
                            @image_url,
                            TRUE,
                            NOW(),
                            NOW(),
                            NOW()
                        )
                        RETURNING id;
                    ", connection, transaction);

                    insertProductCmd.Parameters.AddWithValue("external_id", request.Product.ExternalId);
                    insertProductCmd.Parameters.AddWithValue("name", request.Product.Name.Trim());
                    insertProductCmd.Parameters.AddWithValue("price", request.Product.Price);
                    insertProductCmd.Parameters.AddWithValue("image_url", request.Product.ImageUrl ?? string.Empty);

                    var insertedProductId = await insertProductCmd.ExecuteScalarAsync();

                    if (insertedProductId == null)
                        return StatusCode(500, "Failed to create local product.");

                    productId = Convert.ToInt64(insertedProductId);
                }
            }

            long customerId;

            await using (var findUserCmd = new NpgsqlCommand(@"
                SELECT id
                FROM users
                WHERE email = @email
                LIMIT 1;
            ", connection, transaction))
            {
                findUserCmd.Parameters.AddWithValue("email", request.Email.Trim());

                var existingUserId = await findUserCmd.ExecuteScalarAsync();

                if (existingUserId != null)
                {
                    customerId = Convert.ToInt64(existingUserId);

                    await using var updateUserCmd = new NpgsqlCommand(@"
                        UPDATE users
                        SET full_name = @name
                        WHERE id = @id;
                    ", connection, transaction);

                    updateUserCmd.Parameters.AddWithValue("name", request.Name.Trim());
                    updateUserCmd.Parameters.AddWithValue("id", customerId);
                    await updateUserCmd.ExecuteNonQueryAsync();
                }
                else
                {
                    await using var insertUserCmd = new NpgsqlCommand(@"
                        INSERT INTO users (role_id, full_name, email)
                        VALUES (@role_id, @full_name, @email)
                        RETURNING id;
                    ", connection, transaction);

                    insertUserCmd.Parameters.AddWithValue("role_id", customerRoleId);
                    insertUserCmd.Parameters.AddWithValue("full_name", request.Name.Trim());
                    insertUserCmd.Parameters.AddWithValue("email", request.Email.Trim());

                    var insertedUserId = await insertUserCmd.ExecuteScalarAsync();

                    if (insertedUserId == null)
                        return StatusCode(500, "Failed to create customer user.");

                    customerId = Convert.ToInt64(insertedUserId);
                }
            }

            long assignedAgentId;
            string assignedAgentName;

            await using (var agentCmd = new NpgsqlCommand(@"
                SELECT u.id, u.full_name
                FROM users u
                INNER JOIN user_roles r ON r.id = u.role_id
                WHERE r.code = 'agent' AND u.is_active = TRUE
                ORDER BY random()
                LIMIT 1;
            ", connection, transaction))
            await using (var agentReader = await agentCmd.ExecuteReaderAsync())
            {
                if (!await agentReader.ReadAsync())
                    return StatusCode(500, "No seeded agents found.");

                assignedAgentId = agentReader.GetInt64(0);
                assignedAgentName = agentReader.GetString(1);
            }

            long ticketId;
            long ticketNumber;

            await using (var insertTicketCmd = new NpgsqlCommand(@"
                INSERT INTO tickets (
                    customer_id,
                    assigned_agent_id,
                    product_id,
                    status_id,
                    priority_id,
                    channel_id,
                    issue_type_id,
                    subject,
                    last_message_at
                )
                VALUES (
                    @customer_id,
                    @assigned_agent_id,
                    @product_id,
                    @status_id,
                    @priority_id,
                    @channel_id,
                    @issue_type_id,
                    @subject,
                    NOW()
                )
                RETURNING id, ticket_number;
            ", connection, transaction))
            {
                insertTicketCmd.Parameters.AddWithValue("customer_id", customerId);
                insertTicketCmd.Parameters.AddWithValue("assigned_agent_id", assignedAgentId);
                insertTicketCmd.Parameters.AddWithValue("product_id", productId);
                insertTicketCmd.Parameters.AddWithValue("status_id", openStatusId);
                insertTicketCmd.Parameters.AddWithValue("priority_id", mediumPriorityId);
                insertTicketCmd.Parameters.AddWithValue("channel_id", webChannelId);
                insertTicketCmd.Parameters.AddWithValue("issue_type_id", request.IssueTypeId);
                insertTicketCmd.Parameters.AddWithValue("subject", request.Subject.Trim());

                await using var ticketReader = await insertTicketCmd.ExecuteReaderAsync();

                if (!await ticketReader.ReadAsync())
                    return StatusCode(500, "Failed to create ticket.");

                ticketId = ticketReader.GetInt64(0);
                ticketNumber = ticketReader.GetInt64(1);
            }

            await using (var insertMessageCmd = new NpgsqlCommand(@"
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
                );
            ", connection, transaction))
            {
                insertMessageCmd.Parameters.AddWithValue("ticket_id", ticketId);
                insertMessageCmd.Parameters.AddWithValue("sender_user_id", customerId);
                insertMessageCmd.Parameters.AddWithValue("message_body", request.Message.Trim());
                await insertMessageCmd.ExecuteNonQueryAsync();
            }

            await using (var participantsCmd = new NpgsqlCommand(@"
                INSERT INTO ticket_participants (ticket_id, user_id)
                VALUES (@ticket_id, @customer_id)
                ON CONFLICT DO NOTHING;

                INSERT INTO ticket_participants (ticket_id, user_id)
                VALUES (@ticket_id, @agent_id)
                ON CONFLICT DO NOTHING;
            ", connection, transaction))
            {
                participantsCmd.Parameters.AddWithValue("ticket_id", ticketId);
                participantsCmd.Parameters.AddWithValue("customer_id", customerId);
                participantsCmd.Parameters.AddWithValue("agent_id", assignedAgentId);
                await participantsCmd.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            return Ok(new
            {
                id = ticketId,
                ticketNumber,
                assignedAgentId,
                assignedAgentName
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to create ticket.");
            return StatusCode(500, ex.ToString());
        }
    }
}
