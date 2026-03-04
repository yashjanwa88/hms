-- Billing Service AR Aging Enhancement v3.00
-- Database: billing_db
-- Adds AR aging and revenue analytics

-- =====================================================
-- AR AGING VIEW
-- =====================================================
CREATE OR REPLACE VIEW ar_aging_report AS
SELECT 
    i.tenant_id,
    i.patient_id,
    i.invoice_number,
    i.grand_total,
    i.paid_amount,
    (i.grand_total - i.paid_amount) as outstanding_amount,
    i.created_at as invoice_date,
    EXTRACT(DAYS FROM NOW() - i.created_at) as days_outstanding,
    CASE 
        WHEN EXTRACT(DAYS FROM NOW() - i.created_at) <= 30 THEN '0-30'
        WHEN EXTRACT(DAYS FROM NOW() - i.created_at) <= 60 THEN '31-60'
        WHEN EXTRACT(DAYS FROM NOW() - i.created_at) <= 90 THEN '61-90'
        ELSE '90+'
    END as aging_bucket,
    i.status,
    i.payment_method
FROM invoices i
WHERE i.is_deleted = false 
    AND i.status IN ('Pending', 'Partial')
    AND (i.grand_total - i.paid_amount) > 0;

-- =====================================================
-- REVENUE SUMMARY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS revenue_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    summary_date DATE NOT NULL,
    department VARCHAR(100),
    doctor_id UUID,
    total_invoices INT DEFAULT 0,
    total_revenue NUMERIC(18,2) DEFAULT 0,
    total_collected NUMERIC(18,2) DEFAULT 0,
    total_outstanding NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(tenant_id, summary_date, department, doctor_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_revenue_summaries_tenant_date ON revenue_summaries(tenant_id, summary_date DESC);
CREATE INDEX idx_revenue_summaries_department ON revenue_summaries(department);
CREATE INDEX idx_revenue_summaries_doctor ON revenue_summaries(doctor_id);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON VIEW ar_aging_report IS 'AR aging analysis for outstanding invoices';
COMMENT ON TABLE revenue_summaries IS 'Daily revenue summaries by department and doctor';

-- =====================================================
-- VERSION INFO
-- =====================================================
INSERT INTO schema_version (version, description) 
VALUES ('3.00', 'AR Aging and Revenue Analytics')
ON CONFLICT DO NOTHING;