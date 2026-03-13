namespace SupportTicket.Application.Chat.Interfaces;

public interface ITicketListQueries
{
    Task<IReadOnlyList<TicketListItemDto>> GetRecentAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TicketListItemDto>> GetByCustomerAsync(
        string? customerName,
        string? customerEmail,
        string? status,
        int limit,
        CancellationToken cancellationToken);
}

public sealed class TicketListItemDto
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public string Subject { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
}