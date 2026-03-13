namespace SupportTicket.Application.Chat.Interfaces;

public interface ITicketMetricsQueries
{
    Task<int> CountAllAsync(CancellationToken cancellationToken);

    Task<int> CountByCustomerAsync(
        string? customerName,
        string? customerEmail,
        string? status,
        CancellationToken cancellationToken);

    Task<int> CountByStatusAsync(
        string status,
        CancellationToken cancellationToken);

    Task<int> CountByPriorityAsync(
        string priority,
        CancellationToken cancellationToken);

    Task<int> CountCreatedInRangeAsync(
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken);
}