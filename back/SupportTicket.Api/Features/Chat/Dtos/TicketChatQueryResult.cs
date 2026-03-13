namespace SupportTicket.Application.Chat.Dtos;

public sealed class TicketChatQueryResult
{
    public string Kind { get; init; } = string.Empty;
    public int? Count { get; init; }
    public IReadOnlyList<object>? Items { get; init; }
    public Dictionary<string, object?> Meta { get; init; } = new();
}