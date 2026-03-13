using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace SupportTicket.Api.Controllers;

[ApiController]
[Route("api/analytics/tickets")]
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

    [HttpGet]
    public async Task<IActionResult> GetAnalytics([FromQuery] int days = 90)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
            return StatusCode(500, "Missing connection string: DefaultConnection");

        if (days != 7 && days != 30 && days != 90)
            days = 90;

        var windowStart = DateTime.UtcNow.Date.AddDays(-(days - 1));

        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            var response = new TicketsAnalyticsResponseDto
            {
                Days = days
            };

            const string summarySql = @"
                WITH ticket_metrics AS (
                    SELECT
                        t.id,
                        t.created_at,
                        t.updated_at,
                        t.assigned_agent_id,
                        COALESCE(st.is_closed, FALSE) AS is_closed,
                        COALESCE(st.code, '') AS status_code,
                        COALESCE(pr.code, '') AS priority_code,
                        CASE
                            WHEN t.first_response_at IS NOT NULL AND t.first_response_at > t.created_at
                                THEN EXTRACT(EPOCH FROM (t.first_response_at - t.created_at)) / 3600.0
                            WHEN t.first_response_at IS NULL AND t.updated_at > t.created_at
                                THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0
                            ELSE NULL
                        END AS first_response_hours,
                        CASE
                            WHEN COALESCE(t.resolved_at, t.closed_at) IS NOT NULL
                                 AND COALESCE(t.resolved_at, t.closed_at) > t.created_at
                                THEN EXTRACT(EPOCH FROM (COALESCE(t.resolved_at, t.closed_at) - t.created_at)) / 3600.0
                            WHEN COALESCE(st.code, '') IN ('resolved', 'closed') AND t.updated_at > t.created_at
                                THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0
                            ELSE NULL
                        END AS resolution_hours,
                        COALESCE(
                            t.resolved_at,
                            t.closed_at,
                            CASE
                                WHEN COALESCE(st.code, '') IN ('resolved', 'closed')
                                    THEN t.updated_at
                                ELSE NULL
                            END
                        ) AS resolution_at
                    FROM tickets t
                    LEFT JOIN ticket_statuses st ON st.id = t.status_id
                    LEFT JOIN ticket_priorities pr ON pr.id = t.priority_id
                )
                SELECT
                    COUNT(*) FILTER (WHERE created_at >= @window_start)::int AS total_tickets,
                    COUNT(*) FILTER (WHERE created_at >= @window_start AND is_closed = FALSE)::int AS open_tickets,
                    COUNT(*) FILTER (WHERE resolution_at >= @window_start)::int AS resolved_tickets,
                    COUNT(*) FILTER (WHERE created_at >= @window_start AND priority_code = 'urgent')::int AS urgent_tickets,
                    COUNT(DISTINCT assigned_agent_id) FILTER (
                        WHERE assigned_agent_id IS NOT NULL
                          AND created_at >= @window_start
                    )::int AS active_agents,
                    COALESCE(
                        ROUND(
                            (
                                AVG(first_response_hours) FILTER (
                                    WHERE created_at >= @window_start
                                      AND first_response_hours IS NOT NULL
                                )
                            )::numeric,
                            2
                        ),
                        0
                    ) AS avg_first_response_hours,
                    COALESCE(
                        ROUND(
                            (
                                AVG(resolution_hours) FILTER (
                                    WHERE resolution_at >= @window_start
                                      AND resolution_hours IS NOT NULL
                                )
                            )::numeric,
                            2
                        ),
                        0
                    ) AS avg_resolution_hours
                FROM ticket_metrics;
            ";

            await using (var cmd = new NpgsqlCommand(summarySql, connection))
            {
                cmd.Parameters.AddWithValue("window_start", windowStart);

                await using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    response.TotalTickets = reader.GetInt32(0);
                    response.OpenTickets = reader.GetInt32(1);
                    response.ResolvedTickets = reader.GetInt32(2);
                    response.UrgentTickets = reader.GetInt32(3);
                    response.ActiveAgents = reader.GetInt32(4);
                    response.AvgFirstResponseHours = GetDecimal(reader, 5);
                    response.AvgResolutionHours = GetDecimal(reader, 6);
                }
            }

            const string timelineSql = @"
                WITH days AS (
                    SELECT generate_series(
                        @window_start::date,
                        current_date,
                        interval '1 day'
                    )::date AS day
                ),
                resolution_events AS (
                    SELECT
                        date(
                            COALESCE(
                                t.resolved_at,
                                t.closed_at,
                                CASE
                                    WHEN COALESCE(st.code, '') IN ('resolved', 'closed')
                                        THEN t.updated_at
                                    ELSE NULL
                                END
                            )
                        ) AS day,
                        COUNT(*)::int AS resolved_count
                    FROM tickets t
                    LEFT JOIN ticket_statuses st ON st.id = t.status_id
                    WHERE COALESCE(
                              t.resolved_at,
                              t.closed_at,
                              CASE
                                  WHEN COALESCE(st.code, '') IN ('resolved', 'closed')
                                      THEN t.updated_at
                                  ELSE NULL
                              END
                          ) >= @window_start
                    GROUP BY 1
                )
                SELECT
                    to_char(d.day, 'MM-DD') AS label,
                    COALESCE(created_counts.created_count, 0)::int AS tickets_created,
                    COALESCE(resolution_events.resolved_count, 0)::int AS tickets_resolved
                FROM days d
                LEFT JOIN (
                    SELECT
                        date(created_at) AS day,
                        COUNT(*)::int AS created_count
                    FROM tickets
                    WHERE created_at >= @window_start
                    GROUP BY 1
                ) created_counts ON created_counts.day = d.day
                LEFT JOIN resolution_events ON resolution_events.day = d.day
                ORDER BY d.day;
            ";

            await using (var cmd = new NpgsqlCommand(timelineSql, connection))
            {
                cmd.Parameters.AddWithValue("window_start", windowStart);

                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    response.Timeline.Add(new AnalyticsPointDto
                    {
                        Label = GetText(reader, 0),
                        TicketsCreated = reader.GetInt32(1),
                        TicketsResolved = reader.GetInt32(2)
                    });
                }
            }

            const string byStatusSql = @"
                SELECT
                    COALESCE(
                        NULLIF(TRIM(st.name), ''),
                        INITCAP(REPLACE(COALESCE(st.code, 'unknown'), '_', ' ')),
                        'Unknown'
                    ) AS key,
                    COUNT(*)::int AS count
                FROM tickets t
                LEFT JOIN ticket_statuses st ON st.id = t.status_id
                WHERE t.created_at >= @window_start
                GROUP BY 1
                ORDER BY count DESC, key;
            ";

            await using (var cmd = new NpgsqlCommand(byStatusSql, connection))
            {
                cmd.Parameters.AddWithValue("window_start", windowStart);

                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    response.ByStatus.Add(new AnalyticsBreakdownItemDto
                    {
                        Key = GetText(reader, 0, "Unknown"),
                        Count = reader.GetInt32(1)
                    });
                }
            }

            const string byPrioritySql = @"
                SELECT
                    COALESCE(
                        NULLIF(TRIM(pr.name), ''),
                        INITCAP(REPLACE(COALESCE(pr.code, 'unknown'), '_', ' ')),
                        'Unknown'
                    ) AS key,
                    COUNT(*)::int AS count
                FROM tickets t
                LEFT JOIN ticket_priorities pr ON pr.id = t.priority_id
                WHERE t.created_at >= @window_start
                GROUP BY 1, COALESCE(pr.sort_order, 0)
                ORDER BY COALESCE(pr.sort_order, 0) DESC, key;
            ";

            await using (var cmd = new NpgsqlCommand(byPrioritySql, connection))
            {
                cmd.Parameters.AddWithValue("window_start", windowStart);

                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    response.ByPriority.Add(new AnalyticsBreakdownItemDto
                    {
                        Key = GetText(reader, 0, "Unknown"),
                        Count = reader.GetInt32(1)
                    });
                }
            }

            const string byChannelSql = @"
                SELECT
                    COALESCE(
                        NULLIF(TRIM(ch.name), ''),
                        INITCAP(REPLACE(COALESCE(ch.code, 'unknown'), '_', ' ')),
                        'Unknown'
                    ) AS key,
                    COUNT(*)::int AS count
                FROM tickets t
                LEFT JOIN ticket_channels ch ON ch.id = t.channel_id
                WHERE t.created_at >= @window_start
                GROUP BY 1
                ORDER BY count DESC, key;
            ";

            await using (var cmd = new NpgsqlCommand(byChannelSql, connection))
            {
                cmd.Parameters.AddWithValue("window_start", windowStart);

                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    response.ByChannel.Add(new AnalyticsBreakdownItemDto
                    {
                        Key = GetText(reader, 0, "Unknown"),
                        Count = reader.GetInt32(1)
                    });
                }
            }

            return Ok(response);
        }
        catch (PostgresException ex)
        {
            _logger.LogError(ex, "Analytics query failed. SQLSTATE: {SqlState}", ex.SqlState);
            return StatusCode(500, new
            {
                message = "Analytics query failed.",
                sqlState = ex.SqlState,
                detail = ex.MessageText
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected analytics error.");
            return StatusCode(500, "Unexpected analytics error.");
        }
    }

    private static string GetText(NpgsqlDataReader reader, int ordinal, string fallback = "")
    {
        if (reader.IsDBNull(ordinal))
            return fallback;

        var value = reader.GetString(ordinal).Trim();
        return string.IsNullOrWhiteSpace(value) ? fallback : value;
    }

    private static decimal GetDecimal(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
            return 0;

        return reader.GetDecimal(ordinal);
    }
}
