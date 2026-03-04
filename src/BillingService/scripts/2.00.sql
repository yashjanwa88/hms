-- Billing Service Refund Engine v2.00
-- Database: billing_db
-- Adds refund management with audit trail

-- =====================================================
-- REFUNDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    refund_amount NUMERIC(18,2) NOT NULL CHECK (refund_amount > 0),
    reason VARCHAR(500) NOT NULL,
    refund_method VARCHAR(50) NOT NULL,
    processed_by UUID NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refunds_tenant ON refunds(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_refunds_invoice ON refunds(invoice_id) WHERE is_deleted = false;
CREATE INDEX idx_refunds_processed_at ON refunds(processed_at DESC);

-- =====================================================
-- ADD REFUND FIELDS TO INVOICES
-- =====================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(18,2) DEFAULT 0;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE refunds IS 'Payment refunds with audit trail';
COMMENT ON COLUMN refunds.refund_amount IS 'Amount being refunded';
COMMENT ON COLUMN refunds.reason IS 'Reason for refund';
COMMENT ON COLUMN refunds.refund_method IS 'Cash, Card, UPI, BankTransfer';
COMMENT ON COLUMN refunds.processed_by IS 'User who processed the refund';

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('2.00', 'Refund Engine - Payment refund management')
ON CONFLICT DO NOTHING;
