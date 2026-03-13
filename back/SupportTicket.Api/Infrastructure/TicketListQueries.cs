using System.Data;
using Dapper;
using SupportTicket.Application.Chat.Interfaces;

namespace SupportTicket.Infrastructure.Persistence.Queries;

public sealed class TicketListQueries : ITicketListQueries
{
    private readonly IDbConnection _connection;

    public TicketListQueries(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IReadOnlyList<TicketListItemDto>> GetRecentAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select
                t.id as Id,
                t.public_id as PublicId,
                t.subject as Subject,
                ts.name as Status,
                tp.name as Priority,
                u.full_name as CustomerName,
                u.email as CustomerEmail,
                t.created_at as CreatedAtUtc
            from tickets t
            join users u on u.id = t.customer_id
            join ticket_statuses ts on ts.id = t.status_id
            join ticket_priorities tp on tp.id = t.priority_id
            order by t.created_at desc
            limit @Limit;
            """;

        var items = await _connection.QueryAsync<TicketListItemDto>(new CommandDefinition(
            sql,
            new { Limit = limit },
            cancellationToken: cancellationToken));

        return items.ToList();
    }

    public async Task<IReadOnlyList<TicketListItemDto>> GetByCustomerAsync(
        string? customerName,
        string? customerEmail,
        string? status,
        int limit,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select
                t.id as Id,
                t.public_id as PublicId,
                t.subject as Subject,
                ts.name as Status,
                tp.name as Priority,
                u.full_name as CustomerName,
                u.email as CustomerEmail,
                t.created_at as CreatedAtUtc
            from tickets t
            join users u on u.id = t.customer_id
            join ticket_statuses ts on ts.id = t.status_id
            join ticket_priorities tp on tp.id = t.priority_id
            where (@CustomerName is null or u.full_name ilike '%' || @CustomerName || '%')
              and (@CustomerEmail is null or lower(u.email) = lower(@CustomerEmail))
              and (@Status is null or lower(ts.name) = lower(@Status) or lower(ts.code) = lower(@Status))
            order by t.created_at desc
            limit @Limit;
            """;

        var items = await _connection.QueryAsync<TicketListItemDto>(new CommandDefinition(
            sql,
            new
            {
                CustomerName = customerName,
                CustomerEmail = customerEmail,
                Status = status,
                Limit = limit
            },
            cancellationToken: cancellationToken));

        return items.ToList();
    }
}