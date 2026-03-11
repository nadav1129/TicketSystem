BEGIN;

/* =========================================================
   EXTENSIONS
   ========================================================= */

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   HELPER FUNCTION
   ========================================================= */

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

/* =========================================================
   LOOKUP TABLES
   ========================================================= */

CREATE TABLE IF NOT EXISTS user_roles (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_statuses (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ticket_priorities (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ticket_channels (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_issue_types (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* =========================================================
   USERS
   ========================================================= */

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    role_id SMALLINT NOT NULL REFERENCES user_roles(id),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS ix_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS ix_users_is_active ON users(is_active);

/* =========================================================
   PRODUCTS
   ========================================================= */

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    external_id BIGINT NOT NULL UNIQUE,
    external_slug VARCHAR(255),
    source_name VARCHAR(50) NOT NULL DEFAULT 'platzi_fake_store',

    category_id BIGINT REFERENCES product_categories(id) ON DELETE SET NULL,

    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12,2),
    primary_image_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,

    CONSTRAINT chk_products_price_nonnegative
        CHECK (price IS NULL OR price >= 0)
);

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_product_images_product_id
ON product_images(product_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_product_id_sort_order
ON product_images(product_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_external_slug
ON products(external_slug)
WHERE external_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_products_category_id
ON products(category_id);

CREATE INDEX IF NOT EXISTS ix_products_name
ON products(name);

CREATE INDEX IF NOT EXISTS ix_products_active_category_name
ON products(category_id, name)
WHERE is_active = TRUE;

/* =========================================================
   TICKETS
   ========================================================= */

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    ticket_number BIGINT NOT NULL UNIQUE DEFAULT nextval('ticket_number_seq'),

    customer_id BIGINT NOT NULL REFERENCES users(id),
    assigned_agent_id BIGINT REFERENCES users(id),
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,

    status_id SMALLINT NOT NULL REFERENCES ticket_statuses(id),
    priority_id SMALLINT NOT NULL REFERENCES ticket_priorities(id),
    channel_id SMALLINT NOT NULL REFERENCES ticket_channels(id),
    issue_type_id SMALLINT NOT NULL REFERENCES ticket_issue_types(id),

    subject VARCHAR(200) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,

    CONSTRAINT chk_tickets_customer_agent_different
        CHECK (assigned_agent_id IS NULL OR assigned_agent_id <> customer_id),

    CONSTRAINT chk_tickets_subject_not_blank
        CHECK (length(trim(subject)) > 0)
);

CREATE INDEX IF NOT EXISTS ix_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS ix_tickets_assigned_agent_id ON tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS ix_tickets_product_id ON tickets(product_id);
CREATE INDEX IF NOT EXISTS ix_tickets_status_id ON tickets(status_id);
CREATE INDEX IF NOT EXISTS ix_tickets_priority_id ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS ix_tickets_channel_id ON tickets(channel_id);
CREATE INDEX IF NOT EXISTS ix_tickets_issue_type_id ON tickets(issue_type_id);
CREATE INDEX IF NOT EXISTS ix_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_tickets_last_message_at ON tickets(last_message_at DESC);

CREATE INDEX IF NOT EXISTS ix_tickets_customer_status_created
ON tickets(customer_id, status_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_tickets_agent_status_created
ON tickets(assigned_agent_id, status_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_tickets_status_priority_created
ON tickets(status_id, priority_id, created_at DESC);

/* =========================================================
   TICKET MESSAGES
   ========================================================= */

CREATE TABLE IF NOT EXISTS ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_user_id BIGINT NOT NULL REFERENCES users(id),
    message_body TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_ticket_messages_body_not_blank
        CHECK (length(trim(message_body)) > 0)
);

CREATE INDEX IF NOT EXISTS ix_ticket_messages_ticket_id_created_at
ON ticket_messages(ticket_id, created_at);

CREATE INDEX IF NOT EXISTS ix_ticket_messages_sender_user_id
ON ticket_messages(sender_user_id);

/* =========================================================
   TICKET PARTICIPANTS
   ========================================================= */

CREATE TABLE IF NOT EXISTS ticket_participants (
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id BIGINT REFERENCES ticket_messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ticket_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_ticket_participants_user_id
ON ticket_participants(user_id);

/* =========================================================
   STATUS HISTORY
   ========================================================= */

CREATE TABLE IF NOT EXISTS ticket_status_history (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    old_status_id SMALLINT REFERENCES ticket_statuses(id),
    new_status_id SMALLINT NOT NULL REFERENCES ticket_statuses(id),
    changed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT
);

CREATE INDEX IF NOT EXISTS ix_ticket_status_history_ticket_id_changed_at
ON ticket_status_history(ticket_id, changed_at DESC);

/* =========================================================
   ATTACHMENTS
   ========================================================= */

CREATE TABLE IF NOT EXISTS ticket_attachments (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    ticket_message_id BIGINT REFERENCES ticket_messages(id) ON DELETE CASCADE,
    uploaded_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ticket_attachments_ticket_id
ON ticket_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS ix_ticket_attachments_ticket_message_id
ON ticket_attachments(ticket_message_id);

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
    type_code VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_notifications_user_id_is_read_created_at
ON notifications(user_id, is_read, created_at DESC);

/* =========================================================
   UPDATED_AT TRIGGERS
   ========================================================= */

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_set_updated_at ON products;
CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tickets_set_updated_at ON tickets;
CREATE TRIGGER trg_tickets_set_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

/* =========================================================
   SEED DATA
   ========================================================= */

INSERT INTO user_roles (code, name) VALUES
('customer', 'Customer'),
('agent', 'Agent'),
('admin', 'Admin')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ticket_statuses (code, name, is_closed) VALUES
('open', 'Open', FALSE),
('in_progress', 'In Progress', FALSE),
('waiting_customer', 'Waiting Customer', FALSE),
('resolved', 'Resolved', TRUE),
('closed', 'Closed', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ticket_priorities (code, name, sort_order) VALUES
('low', 'Low', 1),
('medium', 'Medium', 2),
('high', 'High', 3),
('urgent', 'Urgent', 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ticket_channels (code, name) VALUES
('web', 'Web'),
('voice', 'Voice'),
('email', 'Email')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ticket_issue_types (code, name) VALUES
('damaged_item', 'Damaged Item'),
('wrong_item', 'Wrong Item'),
('missing_parts', 'Missing Parts'),
('billing_problem', 'Billing Problem'),
('technical_problem', 'Technical Problem'),
('warranty_request', 'Warranty Request'),
('other', 'Other')
ON CONFLICT (code) DO NOTHING;

INSERT INTO product_categories (name) VALUES
('Kitchen'),
('Cleaning'),
('Electronics'),
('Home'),
('Accessories')
ON CONFLICT (name) DO NOTHING;

COMMIT;