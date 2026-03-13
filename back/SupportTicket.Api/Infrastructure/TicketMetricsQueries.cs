using System.Data;
using Dapper;
using SupportTicket.Application.Chat.Interfaces;

namespace SupportTicket.Infrastructure.Persistence.Queries;

public sealed class TicketMetricsQueries : ITicketMetricsQueries
{
    private readonly IDbConnection _connection;

    public TicketMetricsQueries(IDbConnection connection)
    {
        _connection = connection;
    }

    public Task<int> CountAllAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from tickets t;
            """;

        return _connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));
    }

    public Task<int> CountByCustomerAsync(
        string? customerName,
        string? customerEmail,
        string? status,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from tickets t
            join users u on u.id = t.customer_id
            join ticket_statuses ts on ts.id = t.status_id
            where (@CustomerName is null or u.full_name ilike '%' || @CustomerName || '%')
              and (@CustomerEmail is null or lower(u.email) = lower(@CustomerEmail))
              and (@Status is null or lower(ts.name) = lower(@Status) or lower(ts.code) = lower(@Status));
            """;

        return _connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new
            {
                CustomerName = customerName,
                CustomerEmail = customerEmail,
                Status = status
            },
            cancellationToken: cancellationToken));
    }

    public Task<int> CountByStatusAsync(string status, CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from tickets t
            join ticket_statuses ts on ts.id = t.status_id
            where lower(ts.name) = lower(@Status)
               or lower(ts.code) = lower(@Status);
            """;

        return _connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { Status = status },
            cancellationToken: cancellationToken));
    }

    public Task<int> CountByPriorityAsync(string priority, CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from tickets t
            join ticket_priorities tp on tp.id = t.priority_id
            where lower(tp.name) = lower(@Priority)
               or lower(tp.code) = lower(@Priority);
            """;

        return _connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { Priority = priority },
            cancellationToken: cancellationToken));
    }

    public Task<int> CountCreatedInRangeAsync(
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select count(*)
            from tickets t
            where t.created_at >= @FromUtc
              and t.created_at < @ToUtc;
            """;

        return _connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { FromUtc = fromUtc, ToUtc = toUtc },
            cancellationToken: cancellationToken));
    }
}