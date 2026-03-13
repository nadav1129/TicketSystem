namespace SupportTicket.Application.Chat.Dtos;

public sealed class ChatAskResponse
{
    public string Question { get; init; } = string.Empty;
    public string Intent { get; init; } = string.Empty;
    public string Answer { get; init; } = string.Empty;
    public object? Data { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
}