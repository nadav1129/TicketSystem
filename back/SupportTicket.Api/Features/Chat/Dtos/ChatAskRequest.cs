namespace SupportTicket.Application.Chat.Dtos;

public sealed class ChatAskRequest
{
    public string Question { get; init; } = string.Empty;
}