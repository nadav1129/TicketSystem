using SupportTicket.Application.Chat.Dtos;

namespace SupportTicket.Application.Chat.Interfaces;

public interface ITicketChatApplicationService
{
    Task<ChatAskResponse> AskAsync(string question, CancellationToken cancellationToken);
}