using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using Npgsql;

namespace SupportTicket.Api.Seed;

public sealed class DatabaseSeeder
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<DatabaseSeeder> _logger;
    private readonly SeedOptions _options;

    public DatabaseSeeder(
        IConfiguration configuration,
        HttpClient httpClient,
        IOptions<SeedOptions> options,
        ILogger<DatabaseSeeder> logger)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
        _options = options.Value;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Seeding disabled.");
            return;
        }

        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Missing connection string: DefaultConnection");
        }

        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync(ct);

        if (_options.ImportProducts)
        {
            await ImportProductsAsync(conn, ct);
        }

        if (_options.CreateDemoTickets)
        {
            await SeedDemoTicketsAsync(conn, ct);
        }
    }

    private async Task ImportProductsAsync(NpgsqlConnection conn, CancellationToken ct)
    {
        var products = await _httpClient.GetFromJsonAsync<List<PlatziProductDto>>(
            "https://api.escuelajs.co/api/v1/products",
            ct);

        if (products is null || products.Count == 0)
        {
            _logger.LogWarning("No products returned from API.");
            return;
        }

        foreach (var dto in products.Take(_options.ProductCount))
        {
            var categoryId = await EnsureCategoryAsync(conn, dto.Category?.Name, ct);

            const string upsertProductSql = """
                INSERT INTO products
                (
                    external_id,
                    external_slug,
                    source_name,
                    category_id,
                    name,
                    description,
                    price,
                    primary_image_url,
                    is_active,
                    last_synced_at
                )
                VALUES
                (
                    @external_id,
                    @external_slug,
                    'platzi_fake_store',
                    @category_id,
                    @name,
                    @description,
                    @price,
                    @primary_image_url,
                    TRUE,
                    NOW()
                )
                ON CONFLICT (external_id)
                DO UPDATE SET
                    external_slug = EXCLUDED.external_slug,
                    category_id = EXCLUDED.category_id,
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    primary_image_url = EXCLUDED.primary_image_url,
                    is_active = TRUE,
                    last_synced_at = NOW()
                RETURNING id;
                """;

            await using var cmd = new NpgsqlCommand(upsertProductSql, conn);
            cmd.Parameters.AddWithValue("external_id", dto.Id);
            cmd.Parameters.AddWithValue("external_slug", (object?)dto.Slug ?? DBNull.Value);
            cmd.Parameters.AddWithValue("category_id", (object?)categoryId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("name", dto.Title);
            cmd.Parameters.AddWithValue("description", (object?)dto.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("price", dto.Price);
            cmd.Parameters.AddWithValue("primary_image_url", (object?)dto.Images?.FirstOrDefault() ?? DBNull.Value);

            var productId = (long)(await cmd.ExecuteScalarAsync(ct)
                ?? throw new InvalidOperationException("Failed to upsert product."));

            await SyncProductImagesAsync(conn, productId, dto.Images, ct);
        }

        _logger.LogInformation("Imported products from API.");
    }

    private async Task<long?> EnsureCategoryAsync(
        NpgsqlConnection conn,
        string? categoryName,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(categoryName))
            return null;

        const string sql = """
            INSERT INTO product_categories (name)
            VALUES (@name)
            ON CONFLICT (name)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
            """;

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("name", categoryName.Trim());

        var id = await cmd.ExecuteScalarAsync(ct);
        return id is null ? null : (long)id;
    }

    private async Task SyncProductImagesAsync(
        NpgsqlConnection conn,
        long productId,
        List<string>? images,
        CancellationToken ct)
    {
        if (images is null || images.Count == 0)
            return;

        var distinctImages = images
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .ToList();

        for (var i = 0; i < distinctImages.Count; i++)
        {
            const string sql = """
                INSERT INTO product_images (product_id, image_url, sort_order)
                VALUES (@product_id, @image_url, @sort_order)
                ON CONFLICT (product_id, sort_order) DO NOTHING;
                """;

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("product_id", productId);
            cmd.Parameters.AddWithValue("image_url", distinctImages[i]);
            cmd.Parameters.AddWithValue("sort_order", i);

            await cmd.ExecuteNonQueryAsync(ct);
        }
    }

    private async Task SeedDemoTicketsAsync(NpgsqlConnection conn, CancellationToken ct)
    {
        var existingTicketCount = await ExecuteScalarIntAsync(
            conn,
            "SELECT COUNT(*) FROM tickets;",
            ct);

        if (existingTicketCount >= _options.TicketCount)
        {
            _logger.LogInformation("Tickets already seeded. Count: {Count}", existingTicketCount);
            return;
        }

        await EnsureCustomersAsync(conn, ct);

        var customerIds = await ReadIdsAsync(
            conn,
            """
            SELECT u.id
            FROM users u
            JOIN user_roles r ON r.id = u.role_id
            WHERE r.code = 'customer'
            ORDER BY u.id;
            """,
            ct);

        var agentIds = await ReadIdsAsync(
            conn,
            """
            SELECT u.id
            FROM users u
            JOIN user_roles r ON r.id = u.role_id
            WHERE r.code = 'agent'
            ORDER BY u.id;
            """,
            ct);

        var productIds = await ReadIdsAsync(
            conn,
            "SELECT id FROM products WHERE is_active = TRUE ORDER BY id;",
            ct);

        if (customerIds.Count == 0 || agentIds.Count == 0 || productIds.Count == 0)
        {
            _logger.LogWarning("Missing customers, agents, or products. Skipping ticket seed.");
            return;
        }

        var statusIds = await ReadLookupAsync(conn, "ticket_statuses", ct);
        var priorityIds = await ReadLookupAsync(conn, "ticket_priorities", ct);
        var channelIds = await ReadLookupAsync(conn, "ticket_channels", ct);
        var issueTypeIds = await ReadLookupAsync(conn, "ticket_issue_types", ct);

        var random = new Random();

        for (var i = existingTicketCount; i < _options.TicketCount; i++)
        {
            var customerId = customerIds[random.Next(customerIds.Count)];
            var agentId = agentIds[random.Next(agentIds.Count)];
            var productId = productIds[random.Next(productIds.Count)];

            var statusCode = PickStatusCode(i);
            var priorityCode = PickPriorityCode(i);
            var channelCode = i % 3 == 0 ? "voice" : i % 2 == 0 ? "web" : "email";
            var issueTypeCode = issueTypeIds.Keys.ElementAt(random.Next(issueTypeIds.Count));

            var createdAt = DateTime.UtcNow.AddDays(-random.Next(1, 20));
            var subject = $"Demo ticket {i + 1}";

            const string insertTicketSql = """
                INSERT INTO tickets
                (
                    customer_id,
                    assigned_agent_id,
                    product_id,
                    status_id,
                    priority_id,
                    channel_id,
                    issue_type_id,
                    subject,
                    created_at,
                    first_response_at,
                    last_message_at,
                    resolved_at,
                    closed_at,
                    customer_rating,
                    customer_rating_comment
                )
                VALUES
                (
                    @customer_id,
                    @assigned_agent_id,
                    @product_id,
                    @status_id,
                    @priority_id,
                    @channel_id,
                    @issue_type_id,
                    @subject,
                    @created_at,
                    @first_response_at,
                    @last_message_at,
                    @resolved_at,
                    @closed_at,
                    @customer_rating,
                    @customer_rating_comment
                )
                RETURNING id;
                """;

            await using var ticketCmd = new NpgsqlCommand(insertTicketSql, conn);
            ticketCmd.Parameters.AddWithValue("customer_id", customerId);
            ticketCmd.Parameters.AddWithValue("assigned_agent_id", agentId);
            ticketCmd.Parameters.AddWithValue("product_id", productId);
            ticketCmd.Parameters.AddWithValue("status_id", statusIds[statusCode]);
            ticketCmd.Parameters.AddWithValue("priority_id", priorityIds[priorityCode]);
            ticketCmd.Parameters.AddWithValue("channel_id", channelIds[channelCode]);
            ticketCmd.Parameters.AddWithValue("issue_type_id", issueTypeIds[issueTypeCode]);
            ticketCmd.Parameters.AddWithValue("subject", subject);
            ticketCmd.Parameters.AddWithValue("created_at", createdAt);
            ticketCmd.Parameters.AddWithValue("first_response_at", createdAt.AddHours(2));
            ticketCmd.Parameters.AddWithValue("last_message_at", createdAt.AddHours(4));

            if (statusCode is "resolved" or "closed")
                ticketCmd.Parameters.AddWithValue("resolved_at", createdAt.AddHours(3));
            else
                ticketCmd.Parameters.AddWithValue("resolved_at", DBNull.Value);

            if (statusCode == "closed")
                ticketCmd.Parameters.AddWithValue("closed_at", createdAt.AddHours(4));
            else
                ticketCmd.Parameters.AddWithValue("closed_at", DBNull.Value);

            if (statusCode == "closed")
            {
                ticketCmd.Parameters.AddWithValue("customer_rating", random.Next(3, 6));
                ticketCmd.Parameters.AddWithValue("customer_rating_comment", "Seeded demo feedback");
            }
            else
            {
                ticketCmd.Parameters.AddWithValue("customer_rating", DBNull.Value);
                ticketCmd.Parameters.AddWithValue("customer_rating_comment", DBNull.Value);
            }

            var ticketId = (long)(await ticketCmd.ExecuteScalarAsync(ct)
                ?? throw new InvalidOperationException("Failed to insert ticket."));

            await InsertMessageAsync(conn, ticketId, customerId,
                "Hi, I have an issue with this product. Please help.", createdAt, ct);

            await InsertMessageAsync(conn, ticketId, agentId,
                "We received your request and are checking it.", createdAt.AddHours(2), ct);
        }

        _logger.LogInformation("Demo tickets seeded.");
    }

    private async Task EnsureCustomersAsync(NpgsqlConnection conn, CancellationToken ct)
    {
        var customers = new[]
        {
            ("Eitan Green", "eitan.green@customer.local", "052-100-0001"),
            ("Shira Azulay", "shira.azulay@customer.local", "052-100-0002"),
            ("Amit Ben David", "amit.bendavid@customer.local", "052-100-0003"),
            ("Lior Nissim", "lior.nissim@customer.local", "052-100-0004"),
            ("Tamar Ohana", "tamar.ohana@customer.local", "052-100-0005"),
            ("Gal Sharabi", "gal.sharabi@customer.local", "052-100-0006"),
            ("Roni Malka", "roni.malka@customer.local", "052-100-0007"),
            ("Idan Peretz", "idan.peretz@customer.local", "052-100-0008")
        };

        const string sql = """
            INSERT INTO users (role_id, full_name, email, phone)
            SELECT r.id, @full_name, @email, @phone
            FROM user_roles r
            WHERE r.code = 'customer'
            ON CONFLICT (email) DO NOTHING;
            """;

        foreach (var customer in customers)
        {
            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("full_name", customer.Item1);
            cmd.Parameters.AddWithValue("email", customer.Item2);
            cmd.Parameters.AddWithValue("phone", customer.Item3);
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }

    private static async Task InsertMessageAsync(
        NpgsqlConnection conn,
        long ticketId,
        long senderUserId,
        string body,
        DateTime createdAt,
        CancellationToken ct)
    {
        const string sql = """
            INSERT INTO ticket_messages
            (
                ticket_id,
                sender_user_id,
                message_body,
                is_internal_note,
                created_at
            )
            VALUES
            (
                @ticket_id,
                @sender_user_id,
                @message_body,
                FALSE,
                @created_at
            );
            """;

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("ticket_id", ticketId);
        cmd.Parameters.AddWithValue("sender_user_id", senderUserId);
        cmd.Parameters.AddWithValue("message_body", body);
        cmd.Parameters.AddWithValue("created_at", createdAt);

        await cmd.ExecuteNonQueryAsync(ct);
    }

    private static async Task<int> ExecuteScalarIntAsync(
        NpgsqlConnection conn,
        string sql,
        CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand(sql, conn);
        var result = await cmd.ExecuteScalarAsync(ct);
        return Convert.ToInt32(result);
    }

    private static async Task<List<long>> ReadIdsAsync(
        NpgsqlConnection conn,
        string sql,
        CancellationToken ct)
    {
        var result = new List<long>();

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        while (await reader.ReadAsync(ct))
        {
            result.Add(reader.GetInt64(0));
        }

        return result;
    }

    private static async Task<Dictionary<string, short>> ReadLookupAsync(
        NpgsqlConnection conn,
        string tableName,
        CancellationToken ct)
    {
        var result = new Dictionary<string, short>();

        var sql = $"SELECT code, id FROM {tableName};";

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        while (await reader.ReadAsync(ct))
        {
            result[reader.GetString(0)] = reader.GetInt16(1);
        }

        return result;
    }

    private static string PickStatusCode(int i)
    {
        if (i % 7 == 0) return "closed";
        if (i % 5 == 0) return "resolved";
        if (i % 3 == 0) return "waiting_customer";
        if (i % 2 == 0) return "in_progress";
        return "open";
    }

    private static string PickPriorityCode(int i)
    {
        if (i % 6 == 0) return "urgent";
        if (i % 4 == 0) return "high";
        if (i % 2 == 0) return "medium";
        return "low";
    }
}