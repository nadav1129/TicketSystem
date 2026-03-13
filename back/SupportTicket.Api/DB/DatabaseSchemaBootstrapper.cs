using Npgsql;

namespace SupportTicket.Api.Data;

public static class DatabaseSchemaBootstrapper
{
    public static async Task WaitForDatabaseAndApplyAsync(
        string? connectionString,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Missing connection string: DefaultConnection");

        const int maxRetries = 10;
        var delay = TimeSpan.FromSeconds(3);

        for (var attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                await using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync(cancellationToken);

                await ExecuteSqlFileAsync(connection, "/src/DB/Scripts/001_init.sql", cancellationToken);
                await ExecuteSqlFileAsync(connection, "/src/DB/Scripts/002_fix_ticket_rating_columns.sql", cancellationToken);

                logger.LogInformation("Database connection verified and schema compatibility updates were applied.");
                return;
            }
            catch (Exception ex) when (attempt < maxRetries)
            {
                logger.LogWarning(
                    ex,
                    "Database not ready or schema update failed. Retry {Attempt}/{MaxRetries} in {DelaySeconds} seconds.",
                    attempt,
                    maxRetries,
                    delay.TotalSeconds);

                await Task.Delay(delay, cancellationToken);
            }
        }

        throw new InvalidOperationException("Database was not ready after the configured retry window.");
    }

    private static async Task ExecuteSqlFileAsync(
    NpgsqlConnection connection,
    string path,
    CancellationToken cancellationToken)
{
    if (!File.Exists(path))
        throw new FileNotFoundException($"SQL script not found: {path}");

    var sql = await File.ReadAllTextAsync(path, cancellationToken);

    await using var cmd = new NpgsqlCommand(sql, connection);
    await cmd.ExecuteNonQueryAsync(cancellationToken);
}

    private static async Task EnsureTicketRatingColumnsAsync(
        NpgsqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = 'tickets'
                ) THEN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'costumer_raiting'
                    ) AND EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'customer_rating'
                    ) THEN
                        UPDATE public.tickets
                        SET customer_rating = COALESCE(customer_rating, costumer_raiting)
                        WHERE costumer_raiting IS NOT NULL;

                        ALTER TABLE public.tickets
                        DROP COLUMN costumer_raiting;
                    ELSIF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'costumer_raiting'
                    ) THEN
                        ALTER TABLE public.tickets
                        RENAME COLUMN costumer_raiting TO customer_rating;
                    ELSIF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'customer_rating'
                    ) THEN
                        ALTER TABLE public.tickets
                        ADD COLUMN customer_rating SMALLINT;
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'costumer_comment'
                    ) AND EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'customer_rating_comment'
                    ) THEN
                        UPDATE public.tickets
                        SET customer_rating_comment = COALESCE(customer_rating_comment, costumer_comment)
                        WHERE NULLIF(costumer_comment, '') IS NOT NULL;

                        ALTER TABLE public.tickets
                        DROP COLUMN costumer_comment;
                    ELSIF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'costumer_comment'
                    ) THEN
                        ALTER TABLE public.tickets
                        RENAME COLUMN costumer_comment TO customer_rating_comment;
                    ELSIF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'customer_rating_comment'
                    ) THEN
                        ALTER TABLE public.tickets
                        ADD COLUMN customer_rating_comment TEXT;
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'tickets'
                          AND column_name = 'customer_rating'
                    ) AND NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint c
                        INNER JOIN pg_class t ON t.oid = c.conrelid
                        INNER JOIN pg_namespace n ON n.oid = t.relnamespace
                        WHERE n.nspname = 'public'
                          AND t.relname = 'tickets'
                          AND c.contype = 'c'
                          AND pg_get_constraintdef(c.oid) LIKE '%customer_rating%'
                    ) THEN
                        ALTER TABLE public.tickets
                        ADD CONSTRAINT chk_tickets_customer_rating_range
                        CHECK (customer_rating IS NULL OR customer_rating BETWEEN 1 AND 5);
                    END IF;
                END IF;
            END
            $$;
            """;

        await using var cmd = new NpgsqlCommand(sql, connection);
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
