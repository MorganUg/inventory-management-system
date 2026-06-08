-- =============================================================
-- SWEET MANUFACTURING INVENTORY SYSTEM
-- Full Database Schema — All Issues Fixed
-- =============================================================
-- Execution Order:
-- 1. Extensions & Enums
-- 2. Core tables (users, categories, suppliers, customers)
-- 3. Raw materials & restocks
-- 4. BOM (Bill of Materials)
-- 5. Production (batches, materials, outputs)
-- 6. Finished goods & dispatches
-- 7. Stock movements
-- 8. Predictions
-- 9. Indexes
-- 10. Triggers (updated_at only)
-- =============================================================


-- =============================================================
-- SECTION 1: DATABASE
-- =============================================================

-- Run this separately before executing the rest:
-- CREATE DATABASE sweet_inventory;
-- \c sweet_inventory


-- =============================================================
-- SECTION 2: ENUMS
-- =============================================================

CREATE TYPE batch_status AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE dispatch_status AS ENUM (
    'pending',
    'dispatched',
    'cancelled'
);


-- =============================================================
-- SECTION 3: USERS
-- =============================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff',  -- 'admin' | 'manager' | 'staff'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 4: CATEGORIES
-- =============================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'raw_material', -- 'raw_material' | 'finished_good'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 5: SUPPLIERS
-- =============================================================

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 6: CUSTOMERS
-- Fix: Issue 4 — structured customer tracking instead of plain text
-- =============================================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 7: RAW MATERIALS
-- =============================================================

CREATE TABLE raw_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(20) NOT NULL,              -- 'kg' | 'litres' | 'grams' | 'pieces'
    quantity_in_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 8: RESTOCKS
-- Raw material purchases from suppliers
-- Note: Stock update logic handled in Express (Issue 5 fix)
-- =============================================================

CREATE TABLE restocks (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    quantity_received DECIMAL(10,2) NOT NULL CHECK (quantity_received > 0),
    cost_per_unit DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity_received * cost_per_unit) STORED,
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 9: BILL OF MATERIALS (BOM)
-- Fix: Issue 3 — reusable production recipes per finished good
-- =============================================================

CREATE TABLE bom (
    id SERIAL PRIMARY KEY,
    finished_good_id INTEGER NOT NULL,      -- FK added after finished_goods is created
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,         -- only one active version at a time
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    quantity_per_unit DECIMAL(10,4) NOT NULL CHECK (quantity_per_unit > 0),  -- per 1 finished good unit
    unit VARCHAR(20) NOT NULL,              -- should match raw_materials.unit
    notes TEXT,                             -- e.g. 'sift before use', 'add last'
    UNIQUE(bom_id, material_id)
);


-- =============================================================
-- SECTION 10: PRODUCTION BATCHES
-- =============================================================

CREATE TABLE production_batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(200) NOT NULL,
    status batch_status NOT NULL DEFAULT 'planned',
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 11: BATCH MATERIALS
-- Raw materials consumed in a production batch
-- Auto-populated from BOM via Express service
-- =============================================================

CREATE TABLE batch_materials (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10,2) NOT NULL CHECK (quantity_used > 0),
    UNIQUE(batch_id, material_id)
);


-- =============================================================
-- SECTION 12: FINISHED GOODS
-- Fix: Issue 2 — product catalogue, decoupled from batches
-- =============================================================

CREATE TABLE finished_goods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'pieces',
    quantity_in_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10,2) DEFAULT 0,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    expiry_duration_days INTEGER,           -- shelf life in days
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add the FK from bom to finished_goods
ALTER TABLE bom
ADD CONSTRAINT fk_bom_finished_good
FOREIGN KEY (finished_good_id) REFERENCES finished_goods(id) ON DELETE CASCADE;

-- Ensure only one active BOM version per finished good
CREATE UNIQUE INDEX idx_bom_active_version
ON bom(finished_good_id)
WHERE is_active = TRUE;


-- =============================================================
-- SECTION 13: BATCH OUTPUTS
-- Fix: Issue 2 — links batches to finished goods (many-to-many)
-- =============================================================

CREATE TABLE batch_outputs (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    finished_good_id INTEGER NOT NULL REFERENCES finished_goods(id) ON DELETE CASCADE,
    expected_quantity DECIMAL(10,2),
    actual_quantity DECIMAL(10,2),
    production_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,                       -- calculated from finished_goods.expiry_duration_days
    UNIQUE(batch_id, finished_good_id)
);


-- =============================================================
-- SECTION 14: DISPATCHES
-- Fix: Issue 4 — customer_id replaces plain text dispatched_to
-- Note: Stock update logic handled in Express (Issue 5 fix)
-- =============================================================

CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,
    finished_good_id INTEGER NOT NULL REFERENCES finished_goods(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    quantity_dispatched DECIMAL(10,2) NOT NULL CHECK (quantity_dispatched > 0),
    status dispatch_status DEFAULT 'pending',
    dispatched_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 15: STOCK MOVEMENTS
-- Fix: Issue 1 — full audit trail for all stock changes
-- Inserted by Express service functions, not triggers
-- =============================================================

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw_material', 'finished_good')),
    item_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,        -- positive = stock in, negative = stock out
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'restock',            -- raw material purchased
        'production_use',     -- raw material consumed in a batch
        'production_output',  -- finished good produced from a batch
        'dispatch'            -- finished good sent out to customer
    )),
    reference_id INTEGER,                   -- links to restock / batch / dispatch id
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================
-- SECTION 16: PREDICTIONS
-- Demand forecasting per finished good
-- =============================================================

CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    finished_good_id INTEGER NOT NULL REFERENCES finished_goods(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    predicted_quantity INTEGER NOT NULL,
    model_version VARCHAR(50),              -- e.g. 'arima_v1', 'prophet_2026'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_predictions_good_date
ON predictions(finished_good_id, prediction_date);


-- =============================================================
-- SECTION 17: INDEXES
-- =============================================================

-- users
CREATE INDEX idx_users_email ON users(email);

-- customers
CREATE INDEX idx_customers_name ON customers(name);

-- raw_materials
CREATE INDEX idx_raw_materials_supplier ON raw_materials(supplier_id);
CREATE INDEX idx_raw_materials_category ON raw_materials(category_id);

-- restocks
CREATE INDEX idx_restocks_material ON restocks(material_id);
CREATE INDEX idx_restocks_date ON restocks(received_at);

-- bom
CREATE INDEX idx_bom_finished_good ON bom(finished_good_id);

-- bom_items
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(material_id);

-- production_batches
CREATE INDEX idx_batches_status ON production_batches(status);
CREATE INDEX idx_batches_created_by ON production_batches(created_by);

-- batch_materials
CREATE INDEX idx_batch_materials_batch ON batch_materials(batch_id);
CREATE INDEX idx_batch_materials_material ON batch_materials(material_id);

-- batch_outputs
CREATE INDEX idx_batch_outputs_batch ON batch_outputs(batch_id);
CREATE INDEX idx_batch_outputs_good ON batch_outputs(finished_good_id);

-- finished_goods
CREATE INDEX idx_finished_goods_category ON finished_goods(category_id);

-- dispatches
CREATE INDEX idx_dispatches_good ON dispatches(finished_good_id);
CREATE INDEX idx_dispatches_customer ON dispatches(customer_id);
CREATE INDEX idx_dispatches_date ON dispatches(dispatched_at);

-- stock_movements
CREATE INDEX idx_stock_movements_item ON stock_movements(item_type, item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);


-- =============================================================
-- SECTION 18: TRIGGERS
-- Fix: Issue 5 — triggers handle updated_at ONLY
-- All stock/business logic moved to Express service functions
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_raw_materials_updated_at
    BEFORE UPDATE ON raw_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bom_updated_at
    BEFORE UPDATE ON bom
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_batches_updated_at
    BEFORE UPDATE ON production_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_finished_goods_updated_at
    BEFORE UPDATE ON finished_goods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================
-- SECTION 19: HELPER FUNCTION — POPULATE BATCH FROM BOM
-- Called by Express when creating a new production batch
-- =============================================================

CREATE OR REPLACE FUNCTION populate_batch_from_bom(
    p_batch_id INTEGER,
    p_finished_good_id INTEGER,
    p_quantity DECIMAL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO batch_materials (batch_id, material_id, quantity_used)
    SELECT
        p_batch_id,
        bi.material_id,
        bi.quantity_per_unit * p_quantity
    FROM bom_items bi
    JOIN bom b ON b.id = bi.bom_id
    WHERE b.finished_good_id = p_finished_good_id
      AND b.is_active = TRUE
    ON CONFLICT (batch_id, material_id)
    DO UPDATE SET quantity_used = EXCLUDED.quantity_used;
END;
$$ LANGUAGE plpgsql;


-- =============================================================
-- SECTION 20: USEFUL VIEWS
-- =============================================================

-- Low stock raw materials alert
CREATE VIEW low_stock_materials AS
SELECT
    rm.id,
    rm.name,
    rm.unit,
    rm.quantity_in_stock,
    rm.reorder_level,
    s.name AS supplier_name,
    s.phone AS supplier_phone
FROM raw_materials rm
LEFT JOIN suppliers s ON s.id = rm.supplier_id
WHERE rm.quantity_in_stock <= rm.reorder_level;


-- Current finished goods stock summary
CREATE VIEW finished_goods_summary AS
SELECT
    fg.id,
    fg.name,
    fg.unit,
    fg.quantity_in_stock,
    fg.price_per_unit,
    fg.expiry_duration_days,
    c.name AS category
FROM finished_goods fg
LEFT JOIN categories c ON c.id = fg.category_id;


-- Full stock movement history with item names
CREATE VIEW stock_movement_history AS
SELECT
    sm.id,
    sm.item_type,
    sm.item_id,
    CASE
        WHEN sm.item_type = 'raw_material' THEN rm.name
        WHEN sm.item_type = 'finished_good' THEN fg.name
    END AS item_name,
    sm.quantity,
    sm.movement_type,
    sm.reference_id,
    sm.notes,
    sm.created_at
FROM stock_movements sm
LEFT JOIN raw_materials rm ON sm.item_type = 'raw_material' AND rm.id = sm.item_id
LEFT JOIN finished_goods fg ON sm.item_type = 'finished_good' AND fg.id = sm.item_id
ORDER BY sm.created_at DESC;


-- Active production batches with progress
CREATE VIEW active_batches AS
SELECT
    pb.id,
    pb.batch_name,
    pb.status,
    pb.expected_yield,
    pb.start_date,
    u.username AS created_by,
    COUNT(bm.id) AS materials_count
FROM production_batches pb
LEFT JOIN users u ON u.id = pb.created_by
LEFT JOIN batch_materials bm ON bm.batch_id = pb.id
WHERE pb.status IN ('planned', 'in_progress')
GROUP BY pb.id, u.username;


-- =============================================================
-- END OF SCHEMA
-- =============================================================
-- Table Summary:
--   users             — system users & roles
--   categories        — for raw materials & finished goods
--   suppliers         — raw material suppliers
--   customers         — dispatch recipients (Issue 4 fix)
--   raw_materials     — ingredients & packaging
--   restocks          — raw material purchase records
--   bom               — bill of materials / recipe headers (Issue 3 fix)
--   bom_items         — recipe ingredients per unit (Issue 3 fix)
--   production_batches— production runs
--   batch_materials   — materials used per batch (auto from BOM)
--   batch_outputs     — finished goods per batch (Issue 2 fix)
--   finished_goods    — product catalogue, decoupled (Issue 2 fix)
--   dispatches        — outgoing finished goods (Issue 4 fix)
--   stock_movements   — full audit trail (Issue 1 fix)
--   predictions       — demand forecasting
-- =============================================================