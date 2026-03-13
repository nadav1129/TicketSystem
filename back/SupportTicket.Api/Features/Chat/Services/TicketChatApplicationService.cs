using SupportTicket.Application.Chat.Dtos;
using SupportTicket.Application.Chat.Interfaces;

namespace SupportTicket.Application.Chat.Services;

public sealed class TicketChatApplicationService : ITicketChatApplicationService
{
    private readonly IChatIntentService _chatIntentService;
    private readonly ITicketMetricsQueries _ticketMetricsQueries;
    private readonly ITicketListQueries _ticketListQueries;
    private readonly ChatAnswerFormatter _chatAnswerFormatter;

    public TicketChatApplicationService(
        IChatIntentService chatIntentService,
        ITicketMetricsQueries ticketMetricsQueries,
        ITicketListQueries ticketListQueries,
        ChatAnswerFormatter chatAnswerFormatter)
    {
        _chatIntentService = chatIntentService;
        _ticketMetricsQueries = ticketMetricsQueries;
        _ticketListQueries = ticketListQueries;
        _chatAnswerFormatter = chatAnswerFormatter;
    }

    public async Task<ChatAskResponse> AskAsync(
        string question,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(question))
        {
            return new ChatAskResponse
            {
                Question = question,
                Success = false,
                Error = "Question is required."
            };
        }

        try
        {
            var intent = await _chatIntentService.ExtractIntentAsync(
                question,
                cancellationToken);

            var result = await ExecuteIntentAsync(intent, cancellationToken);
            var answer = _chatAnswerFormatter.Format(intent, result);

            return new ChatAskResponse
            {
                Question = question,
                Intent = intent.IntentName,
                Answer = answer,
                Data = result,
                Success = true
            };
        }
        catch (Exception ex)
        {
            return new ChatAskResponse
            {
                Question = question,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private async Task<TicketChatQueryResult> ExecuteIntentAsync(
        TicketChatIntent intent,
        CancellationToken cancellationToken)
    {
        switch (intent.IntentName)
        {
            case "count_all_tickets":
                return new TicketChatQueryResult
                {
                    Kind = "count",
                    Count = await _ticketMetricsQueries.CountAllAsync(cancellationToken)
                };

            case "count_tickets_by_customer":
                return new TicketChatQueryResult
                {
                    Kind = "count",
                    Count = await _ticketMetricsQueries.CountByCustomerAsync(
                        intent.CustomerName,
                        intent.CustomerEmail,
                        intent.Status,
                        cancellationToken),
                    Meta = new Dictionary<string, object?>
                    {
                        ["customerName"] = intent.CustomerName,
                        ["customerEmail"] = intent.CustomerEmail,
                        ["status"] = intent.Status
                    }
                };

            case "count_tickets_by_status":
                if (string.IsNullOrWhiteSpace(intent.Status))
                {
                    throw new InvalidOperationException(
                        "Status is required for count_tickets_by_status.");
                }

                return new TicketChatQueryResult
                {
                    Kind = "count",
                    Count = await _ticketMetricsQueries.CountByStatusAsync(
                        intent.Status,
                        cancellationToken),
                    Meta = new Dictionary<string, object?>
                    {
                        ["status"] = intent.Status
                    }
                };

            case "count_tickets_by_priority":
                if (string.IsNullOrWhiteSpace(intent.Priority))
                {
                    throw new InvalidOperationException(
                        "Priority is required for count_tickets_by_priority.");
                }

                return new TicketChatQueryResult
                {
                    Kind = "count",
                    Count = await _ticketMetricsQueries.CountByPriorityAsync(
                        intent.Priority,
                        cancellationToken),
                    Meta = new Dictionary<string, object?>
                    {
                        ["priority"] = intent.Priority
                    }
                };

            case "count_tickets_created_in_range":
            {
                var (fromUtc, toUtc) = ResolveRange(intent.DateRange);

                return new TicketChatQueryResult
                {
                    Kind = "count",
                    Count = await _ticketMetricsQueries.CountCreatedInRangeAsync(
                        fromUtc,
                        toUtc,
                        cancellationToken),
                    Meta = new Dictionary<string, object?>
                    {
                        ["dateRange"] = intent.DateRange,
                        ["fromUtc"] = fromUtc,
                        ["toUtc"] = toUtc
                    }
                };
            }

            case "list_recent_tickets":
            {
                var limit = NormalizeLimit(intent.Limit, 5, 50);

                var items = await _ticketListQueries.GetRecentAsync(
                    limit,
                    cancellationToken);

                return new TicketChatQueryResult
                {
                    Kind = "list",
                    Count = items.Count,
                    Items = items.Cast<object>().ToList(),
                    Meta = new Dictionary<string, object?>
                    {
                        ["limit"] = limit
                    }
                };
            }

            case "list_customer_tickets":
            {
                var limit = NormalizeLimit(intent.Limit, 10, 50);

                var items = await _ticketListQueries.GetByCustomerAsync(
                    intent.CustomerName,
                    intent.CustomerEmail,
                    intent.Status,
                    limit,
                    cancellationToken);

                return new TicketChatQueryResult
                {
                    Kind = "list",
                    Count = items.Count,
                    Items = items.Cast<object>().ToList(),
                    Meta = new Dictionary<string, object?>
                    {
                        ["customerName"] = intent.CustomerName,
                        ["customerEmail"] = intent.CustomerEmail,
                        ["status"] = intent.Status,
                        ["limit"] = limit
                    }
                };
            }
            case "unknown":
    return new TicketChatQueryResult
    {
        Kind = "unknown",
        Count = null,
        Items = null,
        Meta = new Dictionary<string, object?>()
    };

            default:
                throw new InvalidOperationException(
                    $"Unsupported intent '{intent.IntentName}'.");
        }
    }

    private static int NormalizeLimit(int? limit, int fallback, int max)
    {
        if (!limit.HasValue || limit.Value <= 0)
        {
            return fallback;
        }

        return Math.Min(limit.Value, max);
    }

    private static (DateTime fromUtc, DateTime toUtc) ResolveRange(string? dateRange)
    {
        var now = DateTime.UtcNow;
        var today = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);

        switch (dateRange?.ToLowerInvariant())
        {
            case "today":
                return (today, today.AddDays(1));

            case "yesterday":
                return (today.AddDays(-1), today);

            case "this_week":
            {
                var startOfWeek = StartOfWeekUtc(today);
                return (startOfWeek, startOfWeek.AddDays(7));
            }

            case "this_month":
            {
                var startOfMonth = new DateTime(
                    today.Year,
                    today.Month,
                    1,
                    0,
                    0,
                    0,
                    DateTimeKind.Utc);

                return (startOfMonth, startOfMonth.AddMonths(1));
            }

            case "all_time":
            case null:
            case "":
                return
                (
                    DateTime.SpecifyKind(DateTime.UnixEpoch, DateTimeKind.Utc),
                    DateTime.SpecifyKind(DateTime.MaxValue, DateTimeKind.Utc)
                );

                

            default:
                throw new InvalidOperationException(
                    $"Unsupported date range '{dateRange}'.");
        }
    }

    private static DateTime StartOfWeekUtc(DateTime date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7;
        return DateTime.SpecifyKind(date.AddDays(-diff), DateTimeKind.Utc);
    }
}