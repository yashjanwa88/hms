-- Billing Service Refund Approval v4.00
-- Database: billing_db
-- Adds refund approval workflow

-- =====================================================
-- ADD APPROVAL FIELDS TO REFUNDS TABLE
-- =====================================================
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'));
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS approved_by UUID NULL;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- =====================================================
-- REFUND APPROVALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    refund_id UUID NOT NULL REFERENCES refunds(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('Approved', 'Rejected')),
    comments TEXT,
    approved_by UUID NOT NULL,
    approved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_approved_by ON refunds(approved_by);
CREATE INDEX idx_refund_approvals_refund ON refund_approvals(refund_id);
CREATE INDEX idx_refund_approvals_approved_by ON refund_approvals(approved_by);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN refunds.status IS 'Refund approval status: Pending, Approved, Rejected';
COMMENT ON COLUMN refunds.approved_by IS 'User who approved/rejected the refund';
COMMENT ON TABLE refund_approvals IS 'Audit trail for refund approvals';

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('4.00', 'Refund Approval Workflow')
ON CONFLICT DO NOTHING;