using SupportTicket.Application.Chat.Dtos;

namespace SupportTicket.Application.Chat.Interfaces;

public interface IChatIntentService
{
    Task<TicketChatIntent> ExtractIntentAsync(
        string question,
        CancellationToken cancellationToken);
}