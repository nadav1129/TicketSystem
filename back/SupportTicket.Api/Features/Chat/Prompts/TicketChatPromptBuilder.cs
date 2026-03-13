using System.Text;

namespace SupportTicket.Application.Chat.Prompts;

public static class TicketChatPromptBuilder
{
    public static string BuildIntentPrompt(string userQuestion)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are an intent extractor for a support ticket system.");
        sb.AppendLine("Return JSON only.");
        sb.AppendLine("Do not explain anything.");
        sb.AppendLine();
        sb.AppendLine("Allowed intents:");
        sb.AppendLine("- count_all_tickets");
        sb.AppendLine("- count_tickets_by_customer");
        sb.AppendLine("- count_tickets_by_status");
        sb.AppendLine("- count_tickets_by_priority");
        sb.AppendLine("- count_tickets_created_in_range");
        sb.AppendLine("- list_recent_tickets");
        sb.AppendLine("- list_customer_tickets");
        sb.AppendLine();
        sb.AppendLine("Allowed dateRange values:");
        sb.AppendLine("- today");
        sb.AppendLine("- yesterday");
        sb.AppendLine("- this_week");
        sb.AppendLine("- this_month");
        sb.AppendLine("- all_time");
        sb.AppendLine();
        sb.AppendLine("Return exactly this schema:");
        sb.AppendLine("{");
        sb.AppendLine("  \"intentName\": \"string\",");
        sb.AppendLine("  \"customerName\": \"string or null\",");
        sb.AppendLine("  \"customerEmail\": \"string or null\",");
        sb.AppendLine("  \"status\": \"string or null\",");
        sb.AppendLine("  \"priority\": \"string or null\",");
        sb.AppendLine("  \"dateRange\": \"string or null\",");
        sb.AppendLine("  \"limit\": number or null");
        sb.AppendLine("}");
        sb.AppendLine();
        sb.AppendLine("User question:");
        sb.AppendLine(userQuestion);

        return sb.ToString();
    }
}