namespace SupportTicket.Application.Chat.Dtos;

public sealed class TicketChatIntent
{
    public string IntentName { get; init; } = string.Empty;
    public string? CustomerName { get; init; }
    public string? CustomerEmail { get; init; }
    public string? Status { get; init; }
    public string? Priority { get; init; }
    public string? DateRange { get; init; }
    public int? Limit { get; init; }
}