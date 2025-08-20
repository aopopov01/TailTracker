-- TailTracker Database Optimization for 150K+ Users
-- Performance tuning, connection pooling, and monitoring queries

-- ===============================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ===============================================

-- User statistics materialized view
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    u.id,
    u.subscription_status,
    COUNT(DISTINCT fm.family_id) as family_count,
    COUNT(DISTINCT p.id) as pet_count,
    COUNT(DISTINCT v.id) as vaccination_count,
    COUNT(DISTINCT mr.id) as medical_record_count,
    MAX(u.last_seen_at) as last_activity,
    u.created_at
FROM users u
LEFT JOIN family_members fm ON u.id = fm.user_id
LEFT JOIN pets p ON fm.family_id = p.family_id
LEFT JOIN vaccinations v ON p.id = v.pet_id
LEFT JOIN medical_records mr ON p.id = mr.pet_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.subscription_status, u.created_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_user_statistics_id ON user_statistics(id);
CREATE INDEX idx_user_statistics_subscription ON user_statistics(subscription_status);
CREATE INDEX idx_user_statistics_activity ON user_statistics(last_activity);

-- Pet health summary materialized view
CREATE MATERIALIZED VIEW pet_health_summary AS
SELECT 
    p.id as pet_id,
    p.family_id,
    p.name,
    p.status,
    COUNT(DISTINCT v.id) as vaccination_count,
    MAX(v.next_due_date) as next_vaccination_due,
    COUNT(DISTINCT m.id) FILTER (WHERE m.active = true) as active_medication_count,
    COUNT(DISTINCT mr.id) as medical_record_count,
    MAX(mr.date_of_record) as last_medical_record,
    p.updated_at
FROM pets p
LEFT JOIN vaccinations v ON p.id = v.pet_id
LEFT JOIN medications m ON p.id = m.pet_id
LEFT JOIN medical_records mr ON p.id = mr.pet_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.family_id, p.name, p.status, p.updated_at;

CREATE UNIQUE INDEX idx_pet_health_summary_id ON pet_health_summary(pet_id);
CREATE INDEX idx_pet_health_summary_family ON pet_health_summary(family_id);
CREATE INDEX idx_pet_health_summary_due_date ON pet_health_summary(next_vaccination_due) 
    WHERE next_vaccination_due IS NOT NULL;

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY pet_health_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule materialized view refresh (run every hour)
-- Note: This would typically be set up as a cron job or scheduled task

-- ===============================================
-- PARTITIONING STRATEGIES
-- ===============================================

-- Partition audit_logs by date for better performance
-- First, create the partitioned table structure

-- Create partitioned audit_logs table (if not exists)
DO $$ 
BEGIN
    -- Check if table needs to be converted to partitioned
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'audit_logs_partitioned'
    ) THEN
        -- Create new partitioned table
        CREATE TABLE audit_logs_partitioned (
            LIKE audit_logs INCLUDING ALL
        ) PARTITION BY RANGE (created_at);
        
        -- Create monthly partitions for current and future months
        CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs_partitioned
            FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
        CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs_partitioned
            FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
        CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs_partitioned
            FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
        CREATE TABLE audit_logs_2025_04 PARTITION OF audit_logs_partitioned
            FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
        CREATE TABLE audit_logs_2025_05 PARTITION OF audit_logs_partitioned
            FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
        CREATE TABLE audit_logs_2025_06 PARTITION OF audit_logs_partitioned
            FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
            
        -- Add indexes to partitions
        CREATE INDEX idx_audit_logs_2025_01_user_id ON audit_logs_2025_01(user_id);
        CREATE INDEX idx_audit_logs_2025_02_user_id ON audit_logs_2025_02(user_id);
        CREATE INDEX idx_audit_logs_2025_03_user_id ON audit_logs_2025_03(user_id);
        CREATE INDEX idx_audit_logs_2025_04_user_id ON audit_logs_2025_04(user_id);
        CREATE INDEX idx_audit_logs_2025_05_user_id ON audit_logs_2025_05(user_id);
        CREATE INDEX idx_audit_logs_2025_06_user_id ON audit_logs_2025_06(user_id);
    END IF;
END
$$;

-- Function to create new audit log partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
    
    -- Add indexes to new partition
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%s_user_id ON %I(user_id)',
        partition_name, partition_name
    );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- ===============================================

-- Function to get database performance metrics
CREATE OR REPLACE FUNCTION get_db_performance_metrics()
RETURNS TABLE (
    metric_name text,
    metric_value numeric,
    unit text,
    description text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'active_connections'::text,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::numeric,
        'count'::text,
        'Number of active database connections'::text
    UNION ALL
    SELECT 
        'idle_connections'::text,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle')::numeric,
        'count'::text,
        'Number of idle database connections'::text
    UNION ALL
    SELECT 
        'cache_hit_ratio'::text,
        (SELECT 
            round(
                (sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0))::numeric, 2
            )
        FROM pg_stat_database),
        'percent'::text,
        'Database cache hit ratio'::text
    UNION ALL
    SELECT 
        'avg_query_time'::text,
        (SELECT round(mean_exec_time, 2) FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 1)::numeric,
        'ms'::text,
        'Average query execution time'::text
    UNION ALL
    SELECT 
        'deadlocks'::text,
        (SELECT sum(deadlocks) FROM pg_stat_database)::numeric,
        'count'::text,
        'Total number of deadlocks'::text;
END;
$$ LANGUAGE plpgsql;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms numeric DEFAULT 1000)
RETURNS TABLE (
    query text,
    calls bigint,
    total_time numeric,
    mean_time numeric,
    max_time numeric,
    percentage_of_total numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.query,
        ss.calls,
        round(ss.total_exec_time::numeric, 2) as total_time,
        round(ss.mean_exec_time::numeric, 2) as mean_time,
        round(ss.max_exec_time::numeric, 2) as max_time,
        round(
            (ss.total_exec_time * 100.0 / sum(ss.total_exec_time) OVER ())::numeric, 2
        ) as percentage_of_total
    FROM pg_stat_statements ss
    WHERE ss.mean_exec_time >= min_duration_ms
    ORDER BY ss.mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get table sizes and bloat information
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    schema_name text,
    table_name text,
    row_count bigint,
    size_bytes bigint,
    size_human text,
    index_size_bytes bigint,
    index_size_human text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        (SELECT reltuples FROM pg_class WHERE relname = tablename)::bigint as row_count,
        pg_total_relation_size(schemaname||'.'||tablename)::bigint as size_bytes,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_human,
        pg_indexes_size(schemaname||'.'||tablename)::bigint as index_size_bytes,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size_human
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- CONNECTION POOLING OPTIMIZATION
-- ===============================================

-- Optimal PostgreSQL configuration for 150K users
-- These would be set in postgresql.conf

/*
Recommended PostgreSQL Configuration:

# Connection Management
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Memory Settings (adjust based on available RAM)
shared_buffers = 4GB                    # 25% of RAM for 16GB system
effective_cache_size = 12GB             # 75% of RAM
work_mem = 64MB                         # For sorting/hashing operations
maintenance_work_mem = 512MB            # For maintenance operations

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
checkpoint_timeout = 10min
max_wal_size = 2GB
min_wal_size = 1GB

# Query Planner
random_page_cost = 1.1                  # For SSD storage
effective_io_concurrency = 200          # For SSD storage

# Logging and Monitoring
log_min_duration_statement = 1000       # Log slow queries > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance Extensions
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000
*/

-- ===============================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- ===============================================

-- Function for automated table maintenance
CREATE OR REPLACE FUNCTION perform_table_maintenance()
RETURNS void AS $$
DECLARE
    table_record record;
BEGIN
    -- Analyze tables that haven't been analyzed recently
    FOR table_record IN 
        SELECT schemaname, tablename
        FROM pg_stat_user_tables 
        WHERE last_analyze < NOW() - INTERVAL '1 day'
           OR last_analyze IS NULL
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(table_record.schemaname) || '.' || quote_ident(table_record.tablename);
    END LOOP;
    
    -- Vacuum tables with high dead tuple ratio
    FOR table_record IN 
        SELECT schemaname, tablename, n_dead_tup, n_live_tup
        FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000 
          AND (n_dead_tup::float / GREATEST(n_live_tup, 1)) > 0.1
    LOOP
        EXECUTE 'VACUUM ' || quote_ident(table_record.schemaname) || '.' || quote_ident(table_record.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update statistics for query planner
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    -- Update statistics on critical tables
    ANALYZE users;
    ANALYZE pets;
    ANALYZE vaccinations;
    ANALYZE medical_records;
    ANALYZE family_members;
    ANALYZE lost_pets;
    ANALYZE notifications;
    
    -- Refresh materialized views
    PERFORM refresh_materialized_views();
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- MONITORING AND ALERTING QUERIES
-- ===============================================

-- Query to identify blocking queries
CREATE OR REPLACE VIEW blocking_queries AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocked_activity.query AS blocked_query,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocking_activity.query AS blocking_query,
    blocked_activity.application_name AS blocked_application,
    blocking_activity.application_name AS blocking_application,
    now() - blocked_activity.query_start AS blocked_duration
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Query to monitor replication lag (if using read replicas)
CREATE OR REPLACE VIEW replication_status AS
SELECT 
    client_addr,
    client_hostname,
    client_port,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    write_lag,
    flush_lag,
    replay_lag,
    sync_priority,
    sync_state
FROM pg_stat_replication;

-- Function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE (
    check_name text,
    status text,
    value numeric,
    threshold numeric,
    description text
) AS $$
BEGIN
    RETURN QUERY
    -- Connection count check
    SELECT 
        'connection_count'::text,
        CASE WHEN conn_count < 180 THEN 'OK' 
             WHEN conn_count < 200 THEN 'WARNING'
             ELSE 'CRITICAL' END::text,
        conn_count::numeric,
        200::numeric,
        'Active database connections'::text
    FROM (SELECT count(*) as conn_count FROM pg_stat_activity) c
    
    UNION ALL
    
    -- Cache hit ratio check
    SELECT 
        'cache_hit_ratio'::text,
        CASE WHEN hit_ratio > 95 THEN 'OK'
             WHEN hit_ratio > 90 THEN 'WARNING'
             ELSE 'CRITICAL' END::text,
        hit_ratio::numeric,
        95::numeric,
        'Database cache hit percentage'::text
    FROM (
        SELECT round((sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0))::numeric, 2) as hit_ratio
        FROM pg_stat_database
    ) h
    
    UNION ALL
    
    -- Blocking queries check
    SELECT 
        'blocking_queries'::text,
        CASE WHEN block_count = 0 THEN 'OK'
             WHEN block_count < 5 THEN 'WARNING'
             ELSE 'CRITICAL' END::text,
        block_count::numeric,
        0::numeric,
        'Number of blocking queries'::text
    FROM (SELECT count(*) as block_count FROM blocking_queries) b;
END;
$$ LANGUAGE plpgsql;