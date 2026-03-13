using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace SupportTicket.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IConfiguration configuration,
        ILogger<AnalyticsController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }
public class AnalyticsPointDto
{
    public string Label { get; set; } = string.Empty;
    public int TicketsCreated { get; set; }
    public int TicketsResolved { get; set; }
}

public class AnalyticsBreakdownItemDto
{
    public string Key { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TicketsAnalyticsResponseDto
{
    public int Days { get; set; }
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int UrgentTickets { get; set; }
    public int ActiveAgents { get; set; }
    public decimal AvgFirstResponseHours { get; set; }
    public decimal AvgResolutionHours { get; set; }
    public List<AnalyticsPointDto> Timeline { get; set; } = new();
    public List<AnalyticsBreakdownItemDto> ByStatus { get; set; } = new();
    public List<AnalyticsBreakdownItemDto> ByPriority { get; set; } = new();
    public List<AnalyticsBreakdownItemDto> ByChannel { get; set; } = new();
}

[HttpGet("tickets")]
public async Task<IActionResult> GetAnalytics([FromQuery] int days = 90)
{
    var connectionString = _configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
        return StatusCode(500, "Missing connection string: DefaultConnection");

    if (days != 7 && days != 30 && days != 90)
        days = 90;

    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    var response = new TicketsAnalyticsResponseDto
    {
        Days = days
    };

    const string summarySql = @"
        SELECT
            COUNT(*)::int AS total_tickets,
            COUNT(*) FILTER (WHERE st.is_closed = FALSE)::int AS open_tickets,
            COUNT(*) FILTER (WHERE st.code IN ('resolved', 'closed'))::int AS resolved_tickets,
            COUNT(*) FILTER (WHERE pr.code = 'urgent')::int AS urgent_tickets,
            COUNT(DISTINCT t.assigned_agent_id)::int AS active_agents,
            COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (t.first_response_at - t.created_at)) / 3600.0)::numeric, 2), 0) AS avg_first_response_hours,
            COALESCE(ROUND(AVG(
                EXTRACT(EPOCH FROM (
                    COALESCE(t.closed_at, t.resolved_at) - t.created_at
                )) / 3600.0
            ) FILTER (WHERE COALESCE(t.closed_at, t.resolved_at) IS NOT NULL)::numeric, 2), 0) AS avg_resolution_hours
        FROM tickets t
        INNER JOIN ticket_statuses st ON st.id = t.status_id
        INNER JOIN ticket_priorities pr ON pr.id = t.priority_id;
    ";

    await using (var cmd = new NpgsqlCommand(summarySql, connection))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
        if (await reader.ReadAsync())
        {
            response.TotalTickets = reader.GetInt32(0);
            response.OpenTickets = reader.GetInt32(1);
            response.ResolvedTickets = reader.GetInt32(2);
            response.UrgentTickets = reader.GetInt32(3);
            response.ActiveAgents = reader.GetInt32(4);
            response.AvgFirstResponseHours = reader.GetDecimal(5);
            response.AvgResolutionHours = reader.GetDecimal(6);
        }
    }

    const string timelineSql = @"
        WITH days AS (
            SELECT generate_series(
                current_date - (@days - 1) * interval '1 day',
                current_date,
                interval '1 day'
            )::date AS day
        )
        SELECT
            to_char(d.day, 'MM-DD') AS label,
            COALESCE(created_counts.created_count, 0)::int AS tickets_created,
            COALESCE(resolved_counts.resolved_count, 0)::int AS tickets_resolved
        FROM days d
        LEFT JOIN (
            SELECT
                date(created_at) AS day,
                COUNT(*) AS created_count
            FROM tickets
            WHERE created_at >= current_date - (@days - 1) * interval '1 day'
            GROUP BY date(created_at)
        ) created_counts ON created_counts.day = d.day
        LEFT JOIN (
            SELECT
                date(COALESCE(resolved_at, closed_at)) AS day,
                COUNT(*) AS resolved_count
            FROM tickets
            WHERE COALESCE(resolved_at, closed_at) >= current_date - (@days - 1) * interval '1 day'
            GROUP BY date(COALESCE(resolved_at, closed_at))
        ) resolved_counts ON resolved_counts.day = d.day
        ORDER BY d.day;
    ";

    await using (var cmd = new NpgsqlCommand(timelineSql, connection))
    {
        cmd.Parameters.AddWithValue("days", days);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            response.Timeline.Add(new AnalyticsPointDto
            {
                Label = reader.GetString(0),
                TicketsCreated = reader.GetInt32(1),
                TicketsResolved = reader.GetInt32(2)
            });
        }
    }

    const string byStatusSql = @"
        SELECT st.name, COUNT(*)::int
        FROM tickets t
        INNER JOIN ticket_statuses st ON st.id = t.status_id
        GROUP BY st.name
        ORDER BY COUNT(*) DESC, st.name;
    ";

    await using (var cmd = new NpgsqlCommand(byStatusSql, connection))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
        {
            response.ByStatus.Add(new AnalyticsBreakdownItemDto
            {
                Key = reader.GetString(0),
                Count = reader.GetInt32(1)
            });
        }
    }

    const string byPrioritySql = @"
        SELECT pr.name, COUNT(*)::int
        FROM tickets t
        INNER JOIN ticket_priorities pr ON pr.id = t.priority_id
        GROUP BY pr.name, pr.sort_order
        ORDER BY pr.sort_order DESC;
    ";

    await using (var cmd = new NpgsqlCommand(byPrioritySql, connection))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
        {
            response.ByPriority.Add(new AnalyticsBreakdownItemDto
            {
                Key = reader.GetString(0),
                Count = reader.GetInt32(1)
            });
        }
    }

    const string byChannelSql = @"
        SELECT ch.name, COUNT(*)::int
        FROM tickets t
        INNER JOIN ticket_channels ch ON ch.id = t.channel_id
        GROUP BY ch.name
        ORDER BY COUNT(*) DESC, ch.name;
    ";

    await using (var cmd = new NpgsqlCommand(byChannelSql, connection))
    await using (var reader = await cmd.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
        {
            response.ByChannel.Add(new AnalyticsBreakdownItemDto
            {
                Key = reader.GetString(0),
                Count = reader.GetInt32(1)
            });
        }
    }

    return Ok(response);
}
}