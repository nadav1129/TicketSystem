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
        ) AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'tickets'
              AND column_name = 'customer_rating'
        ) THEN
            ALTER TABLE public.tickets
            RENAME COLUMN costumer_raiting TO customer_rating;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'tickets'
              AND column_name = 'costumer_comment'
        ) AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'tickets'
              AND column_name = 'customer_rating_comment'
        ) THEN
            ALTER TABLE public.tickets
            RENAME COLUMN costumer_comment TO customer_rating_comment;
        END IF;
    END IF;
END
$$;
