-- Appointment Service Queue Management v2.00
-- Database: appointment_db
-- Adds queue token management for OPD operations

-- =====================================================
-- QUEUE TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS queue_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Token Information
    token_number VARCHAR(10) NOT NULL,  -- T001, T002, etc.
    token_prefix VARCHAR(5) DEFAULT 'T',
    sequence_number INT NOT NULL,
    
    -- Patient & Appointment
    patient_id UUID NOT NULL,
    patient_name VARCHAR(200) NOT NULL,
    appointment_id UUID,  -- Optional, can be walk-in
    doctor_id UUID NOT NULL,
    doctor_name VARCHAR(200) NOT NULL,
    
    -- Queue Status
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Waiting',  -- Waiting, Called, InProgress, Completed, Cancelled
    
    -- Timestamps
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    called_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Additional Info
    priority INT DEFAULT 0,  -- 0 = Normal, 1 = Senior Citizen, 2 = Emergency
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT uk_queue_token_tenant_date UNIQUE (tenant_id, token_number, queue_date)
);

-- Indexes for performance
CREATE INDEX idx_queue_tokens_tenant ON queue_tokens(tenant_id, queue_date) WHERE is_deleted = false;
CREATE INDEX idx_queue_tokens_status ON queue_tokens(status, queue_date) WHERE is_deleted = false;
CREATE INDEX idx_queue_tokens_doctor ON queue_tokens(doctor_id, queue_date) WHERE is_deleted = false;
CREATE INDEX idx_queue_tokens_patient ON queue_tokens(patient_id) WHERE is_deleted = false;
CREATE INDEX idx_queue_tokens_date ON queue_tokens(queue_date DESC);
CREATE INDEX idx_queue_tokens_assigned ON queue_tokens(assigned_at DESC);

COMMENT ON TABLE queue_tokens IS 'Patient queue tokens for OPD management';
COMMENT ON COLUMN queue_tokens.status IS 'Waiting, Called, InProgress, Completed, Cancelled';
COMMENT ON COLUMN queue_tokens.priority IS '0=Normal, 1=Senior Citizen, 2=Emergency';

-- =====================================================
-- QUEUE SEQUENCE TABLE (for token number generation)
-- =====================================================
CREATE TABLE IF NOT EXISTS queue_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    queue_date DATE NOT NULL,
    prefix VARCHAR(5) NOT NULL DEFAULT 'T',
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_queue_seq_tenant_date_prefix UNIQUE (tenant_id, queue_date, prefix)
);

CREATE INDEX idx_queue_sequences_tenant_date ON queue_sequences(tenant_id, queue_date);

COMMENT ON TABLE queue_sequences IS 'Maintains daily token sequence counters';

-- =====================================================
-- QUEUE STATISTICS TABLE (for analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS queue_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    queue_date DATE NOT NULL,
    doctor_id UUID,
    
    -- Counts
    total_tokens INT DEFAULT 0,
    completed_tokens INT DEFAULT 0,
    cancelled_tokens INT DEFAULT 0,
    waiting_tokens INT DEFAULT 0,
    
    -- Timing
    avg_wait_time_minutes INT,  -- Average wait time
    min_wait_time_minutes INT,
    max_wait_time_minutes INT,
    avg_service_time_minutes INT,  -- Average consultation time
    
    -- Updated timestamp
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uk_queue_stats_tenant_date_doctor UNIQUE (tenant_id, queue_date, doctor_id)
);

CREATE INDEX idx_queue_stats_tenant_date ON queue_statistics(tenant_id, queue_date);
CREATE INDEX idx_queue_stats_doctor ON queue_statistics(doctor_id, queue_date);

COMMENT ON TABLE queue_statistics IS 'Daily queue performance metrics';

-- =====================================================
-- FUNCTIONS FOR QUEUE MANAGEMENT
-- =====================================================

-- Function to generate next token number
CREATE OR REPLACE FUNCTION get_next_token_number(
    p_tenant_id UUID,
    p_prefix VARCHAR(5) DEFAULT 'T'
)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
    v_sequence INT;
    v_token VARCHAR(10);
BEGIN
    -- Get or create sequence for today
    INSERT INTO queue_sequences (id, tenant_id, queue_date, prefix, last_sequence)
    VALUES (uuid_generate_v4(), p_tenant_id, v_date, p_prefix, 1)
    ON CONFLICT (tenant_id, queue_date, prefix) 
    DO UPDATE SET last_sequence = queue_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_sequence;
    
    -- Format token: T001, T002, etc.
    v_token := p_prefix || LPAD(v_sequence::TEXT, 3, '0');
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_token_number IS 'Generates next sequential token number for the day';

-- Function to calculate wait time
CREATE OR REPLACE FUNCTION calculate_wait_time(p_token_id UUID)
RETURNS INT AS $$
DECLARE
    v_wait_minutes INT;
BEGIN
    SELECT EXTRACT(EPOCH FROM (COALESCE(called_at, NOW()) - assigned_at)) / 60
    INTO v_wait_minutes
    FROM queue_tokens
    WHERE id = p_token_id;
    
    RETURN COALESCE(v_wait_minutes, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_wait_time IS 'Calculates wait time in minutes for a token';

-- Function to get current queue position
CREATE OR REPLACE FUNCTION get_queue_position(p_token_id UUID)
RETURNS INT AS $$
DECLARE
    v_position INT;
    v_assigned_at TIMESTAMP;
    v_tenant_id UUID;
    v_doctor_id UUID;
    v_queue_date DATE;
BEGIN
    SELECT assigned_at, tenant_id, doctor_id, queue_date
    INTO v_assigned_at, v_tenant_id, v_doctor_id, v_queue_date
    FROM queue_tokens
    WHERE id = p_token_id;
    
    SELECT COUNT(*) + 1
    INTO v_position
    FROM queue_tokens
    WHERE tenant_id = v_tenant_id
      AND doctor_id = v_doctor_id
      AND queue_date = v_queue_date
      AND status IN ('Waiting', 'Called')
      AND assigned_at < v_assigned_at
      AND is_deleted = false;
    
    RETURN v_position;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_queue_position IS 'Returns current position in queue for a token';

-- =====================================================
-- VIEW: Active Queue Summary
-- =====================================================
CREATE OR REPLACE VIEW vw_active_queue AS
SELECT 
    qt.id,
    qt.tenant_id,
    qt.token_number,
    qt.patient_name,
    qt.doctor_name,
    qt.status,
    qt.priority,
    qt.assigned_at,
    qt.called_at,
    EXTRACT(EPOCH FROM (NOW() - qt.assigned_at)) / 60 as wait_time_minutes,
    get_queue_position(qt.id) as queue_position
FROM queue_tokens qt
WHERE qt.queue_date = CURRENT_DATE
  AND qt.status IN ('Waiting', 'Called', 'InProgress')
  AND qt.is_deleted = false
ORDER BY qt.priority DESC, qt.assigned_at ASC;

COMMENT ON VIEW vw_active_queue IS 'Real-time view of active queue with wait times';

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================
-- Insert sample token prefixes
INSERT INTO queue_sequences (id, tenant_id, queue_date, prefix, last_sequence)
VALUES 
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', CURRENT_DATE, 'T', 0),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', CURRENT_DATE, 'E', 0)  -- Emergency
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERSION INFO
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_version (version, description) 
VALUES ('2.00', 'Queue Management System - Token generation, queue display, analytics')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- PERMISSIONS (for reference)
-- =====================================================
-- Required permissions:
-- queue.view - View queue display
-- queue.manage - Call next patient, manage queue
-- queue.create - Create queue token
-- queue.analytics - View queue statistics
