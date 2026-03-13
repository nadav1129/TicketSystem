using SupportTicket.Application.Chat.Dtos;

namespace SupportTicket.Application.Chat.Services;

public sealed class ChatAnswerFormatter
{
    public string Format(TicketChatIntent intent, TicketChatQueryResult result)
    {
        return intent.IntentName switch
        {
            "count_all_tickets" => $"There are {result.Count ?? 0} tickets in total.",
            "count_tickets_by_customer" => FormatCustomerCount(intent, result),
            "count_tickets_by_status" => $"There are {result.Count ?? 0} {intent.Status} tickets.",
            "count_tickets_by_priority" => $"There are {result.Count ?? 0} {intent.Priority} priority tickets.",
            "count_tickets_created_in_range" => $"There are {result.Count ?? 0} tickets in the selected date range.",
            "list_recent_tickets" => $"I found {result.Count ?? 0} recent tickets.",
            "list_customer_tickets" => $"I found {result.Count ?? 0} tickets for that customer.",
            "unknown" => "I could not understand that request yet. Try things like 'how many open tickets', 'show recent tickets', or 'tickets for customer@example.com'.",
            _ => "The request completed successfully."
        };
    }

    private static string FormatCustomerCount(TicketChatIntent intent, TicketChatQueryResult result)
    {
        var count = result.Count ?? 0;

        if (!string.IsNullOrWhiteSpace(intent.CustomerName) && !string.IsNullOrWhiteSpace(intent.Status))
            return $"{intent.CustomerName} has {count} {intent.Status} tickets.";

        if (!string.IsNullOrWhiteSpace(intent.CustomerName))
            return $"{intent.CustomerName} has {count} tickets.";

        if (!string.IsNullOrWhiteSpace(intent.CustomerEmail) && !string.IsNullOrWhiteSpace(intent.Status))
            return $"{intent.CustomerEmail} has {count} {intent.Status} tickets.";

        if (!string.IsNullOrWhiteSpace(intent.CustomerEmail))
            return $"{intent.CustomerEmail} has {count} tickets.";

        return $"I found {count} matching tickets.";
    }
}