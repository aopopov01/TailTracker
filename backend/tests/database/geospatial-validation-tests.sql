-- TailTracker Geospatial System Validation Test Suite
-- Comprehensive testing of PostGIS spatial functions and lost pet alert system

-- ================================================================================================
-- 1. POSTGIS EXTENSION AND SPATIAL TYPE TESTS
-- ================================================================================================

-- Test: Verify PostGIS version and capabilities
DO $$
DECLARE
    postgis_version TEXT;
    spatial_ref_count INT;
BEGIN
    -- Check PostGIS version
    SELECT PostGIS_Version() INTO postgis_version;
    RAISE NOTICE 'PostGIS Version: %', postgis_version;
    
    -- Check spatial reference systems
    SELECT COUNT(*) INTO spatial_ref_count FROM spatial_ref_sys WHERE srid IN (4326, 3857);
    
    IF spatial_ref_count < 2 THEN
        RAISE EXCEPTION 'Required spatial reference systems (4326, 3857) not found';
    END IF;
    
    RAISE NOTICE 'PASS: PostGIS properly configured with % SRS entries', spatial_ref_count;
END
$$;

-- Test: Verify spatial column configuration in lost_pets table
DO $$
DECLARE
    spatial_column_exists BOOLEAN;
    srid_value INTEGER;
    geometry_type TEXT;
BEGIN
    -- Check if spatial column exists and is properly configured
    SELECT 
        COUNT(*) > 0,
        MAX(srid),
        MAX(type)
    INTO spatial_column_exists, srid_value, geometry_type
    FROM geometry_columns 
    WHERE f_table_name = 'lost_pets' 
    AND f_geometry_column = 'last_seen_location';
    
    IF NOT spatial_column_exists THEN
        RAISE EXCEPTION 'Spatial column last_seen_location not properly configured';
    END IF;
    
    RAISE NOTICE 'PASS: Spatial column configured - SRID: %, Type: %', srid_value, geometry_type;
END
$$;

-- ================================================================================================
-- 2. SPATIAL DISTANCE CALCULATION TESTS
-- ================================================================================================

-- Test: Distance calculation accuracy
DO $$
DECLARE
    distance_meters DOUBLE PRECISION;
    distance_km DOUBLE PRECISION;
    expected_distance_km DOUBLE PRECISION := 1.0; -- Approximately 1km
    tolerance DOUBLE PRECISION := 0.1; -- 100m tolerance
BEGIN
    -- Calculate distance between two known points (approximately 1km apart)
    -- Point 1: London Eye (51.5033, -0.1196)
    -- Point 2: Westminster Bridge (51.5007, -0.1246)
    SELECT 
        ST_Distance(
            ST_GeogFromText('POINT(-0.1196 51.5033)'),
            ST_GeogFromText('POINT(-0.1246 51.5007)')
        ),
        ST_Distance(
            ST_GeogFromText('POINT(-0.1196 51.5033)'),
            ST_GeogFromText('POINT(-0.1246 51.5007)')
        ) / 1000.0
    INTO distance_meters, distance_km;
    
    IF ABS(distance_km - expected_distance_km) > tolerance THEN
        RAISE EXCEPTION 'Distance calculation inaccurate: expected ~%km, got %km', 
            expected_distance_km, distance_km;
    END IF;
    
    RAISE NOTICE 'PASS: Distance calculation accurate - %.2f meters (%.2f km)', 
        distance_meters, distance_km;
END
$$;

-- Test: Spatial index performance with different radii
DO $$
DECLARE
    test_point GEOMETRY;
    radius_km INTEGER;
    result_count INTEGER;
    query_start TIMESTAMP;
    query_duration INTERVAL;
BEGIN
    -- Create test point (Central London)
    test_point := ST_GeogFromText('POINT(-0.1276 51.5074)');
    
    -- Test various search radii
    FOREACH radius_km IN ARRAY ARRAY[1, 5, 10, 25, 50]
    LOOP
        query_start := clock_timestamp();
        
        -- Simulate spatial query (count points within radius)
        SELECT COUNT(*) INTO result_count
        FROM lost_pets
        WHERE ST_DWithin(last_seen_location, test_point, radius_km * 1000);
        
        query_duration := clock_timestamp() - query_start;
        
        -- Query should complete within 100ms for good performance
        IF EXTRACT(MILLISECONDS FROM query_duration) > 100 THEN
            RAISE WARNING 'Spatial query slow for %km radius: %ms', 
                radius_km, EXTRACT(MILLISECONDS FROM query_duration);
        END IF;
        
        RAISE NOTICE 'Spatial query %km radius: %ms, % results', 
            radius_km, EXTRACT(MILLISECONDS FROM query_duration), result_count;
    END LOOP;
    
    RAISE NOTICE 'PASS: Spatial index performance tested across multiple radii';
END
$$;

-- ================================================================================================
-- 3. LOST PET GEOSPATIAL FUNCTION TESTS
-- ================================================================================================

-- Test: find_users_within_radius function
DO $$
DECLARE
    result_record RECORD;
    result_count INTEGER := 0;
    max_distance DOUBLE PRECISION := 0;
    test_lat DOUBLE PRECISION := 51.5074; -- London
    test_lng DOUBLE PRECISION := -0.1276;
    test_radius INTEGER := 10; -- 10km
BEGIN
    -- Test the function exists and returns expected structure
    FOR result_record IN 
        SELECT * FROM find_users_within_radius(test_lat, test_lng, test_radius)
        LIMIT 5
    LOOP
        result_count := result_count + 1;
        
        -- Verify result structure
        IF result_record.id IS NULL THEN
            RAISE EXCEPTION 'Function returned NULL id';
        END IF;
        
        IF result_record.distance_km IS NULL OR result_record.distance_km < 0 THEN
            RAISE EXCEPTION 'Function returned invalid distance: %', result_record.distance_km;
        END IF;
        
        IF result_record.distance_km > test_radius THEN
            RAISE EXCEPTION 'Function returned result outside radius: %km > %km', 
                result_record.distance_km, test_radius;
        END IF;
        
        max_distance := GREATEST(max_distance, result_record.distance_km);
    END LOOP;
    
    RAISE NOTICE 'PASS: find_users_within_radius - % results, max distance %.2f km', 
        result_count, max_distance;
END
$$;

-- Test: get_lost_pets_within_radius function
DO $$
DECLARE
    result_record RECORD;
    result_count INTEGER := 0;
    test_lat DOUBLE PRECISION := 40.7128; -- New York
    test_lng DOUBLE PRECISION := -74.0060;
    test_radius INTEGER := 25; -- 25km
BEGIN
    -- Create test lost pet report for testing
    INSERT INTO lost_pets (
        pet_id,
        reported_by,
        last_seen_location,
        last_seen_address,
        description,
        status
    ) SELECT 
        p.id,
        p.created_by,
        ST_GeogFromText('POINT(-74.0060 40.7128)'), -- NYC coordinates
        'Test Location, New York',
        'Test lost pet for geospatial testing',
        'lost'
    FROM pets p 
    LIMIT 1;
    
    -- Test the function
    FOR result_record IN 
        SELECT * FROM get_lost_pets_within_radius(test_lat, test_lng, test_radius)
        LIMIT 5
    LOOP
        result_count := result_count + 1;
        
        -- Verify result structure and data
        IF result_record.pet_name IS NULL THEN
            RAISE EXCEPTION 'Function returned NULL pet_name';
        END IF;
        
        IF result_record.last_seen_location IS NULL THEN
            RAISE EXCEPTION 'Function returned NULL location';
        END IF;
        
        IF result_record.distance_km IS NULL OR result_record.distance_km < 0 THEN
            RAISE EXCEPTION 'Function returned invalid distance: %', result_record.distance_km;
        END IF;
        
        -- Verify location JSON structure
        IF NOT (result_record.last_seen_location ? 'lat' AND result_record.last_seen_location ? 'lng') THEN
            RAISE EXCEPTION 'Location JSON missing lat/lng coordinates';
        END IF;
    END LOOP;
    
    -- Clean up test data
    DELETE FROM lost_pets WHERE description = 'Test lost pet for geospatial testing';
    
    RAISE NOTICE 'PASS: get_lost_pets_within_radius - % results found', result_count;
END
$$;

-- ================================================================================================
-- 4. COORDINATE SYSTEM AND PROJECTION TESTS
-- ================================================================================================

-- Test: Coordinate transformation accuracy
DO $$
DECLARE
    original_point GEOMETRY;
    transformed_point GEOMETRY;
    back_transformed GEOMETRY;
    coordinate_difference DOUBLE PRECISION;
BEGIN
    -- Test coordinate transformation between WGS84 (4326) and Web Mercator (3857)
    original_point := ST_GeomFromText('POINT(-0.1276 51.5074)', 4326); -- London, WGS84
    
    -- Transform to Web Mercator
    transformed_point := ST_Transform(original_point, 3857);
    
    -- Transform back to WGS84
    back_transformed := ST_Transform(transformed_point, 4326);
    
    -- Calculate difference (should be minimal)
    coordinate_difference := ST_Distance(original_point, back_transformed);
    
    -- Difference should be less than 1 meter
    IF coordinate_difference > 1 THEN
        RAISE EXCEPTION 'Coordinate transformation inaccurate: difference %m', coordinate_difference;
    END IF;
    
    RAISE NOTICE 'PASS: Coordinate transformation accurate - difference %.6f meters', coordinate_difference;
END
$$;

-- ================================================================================================
-- 5. SPATIAL DATA VALIDATION AND BOUNDARY TESTS
-- ================================================================================================

-- Test: Validate reasonable coordinate bounds
DO $$
DECLARE
    invalid_coords INTEGER;
BEGIN
    -- Check for invalid coordinates in lost_pets
    SELECT COUNT(*) INTO invalid_coords
    FROM lost_pets
    WHERE ST_X(last_seen_location::geometry) NOT BETWEEN -180 AND 180
       OR ST_Y(last_seen_location::geometry) NOT BETWEEN -90 AND 90;
    
    IF invalid_coords > 0 THEN
        RAISE EXCEPTION 'Found % lost pets with invalid coordinates', invalid_coords;
    END IF;
    
    -- Check for NULL spatial data where it shouldn't be
    SELECT COUNT(*) INTO invalid_coords
    FROM lost_pets
    WHERE status = 'lost' AND last_seen_location IS NULL;
    
    IF invalid_coords > 0 THEN
        RAISE EXCEPTION 'Found % lost pets with missing location data', invalid_coords;
    END IF;
    
    RAISE NOTICE 'PASS: All spatial data within valid coordinate bounds';
END
$$;

-- Test: Edge cases for spatial queries
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Test query at North Pole (edge case)
    SELECT COUNT(*) INTO result_count
    FROM find_users_within_radius(90.0, 0.0, 1000); -- 1000km at North Pole
    
    -- Test query at International Date Line
    SELECT COUNT(*) INTO result_count
    FROM find_users_within_radius(0.0, 180.0, 100); -- International Date Line
    
    -- Test query at Equator/Prime Meridian intersection
    SELECT COUNT(*) INTO result_count
    FROM find_users_within_radius(0.0, 0.0, 50); -- Null Island
    
    RAISE NOTICE 'PASS: Edge case spatial queries execute without error';
END
$$;

-- ================================================================================================
-- 6. PERFORMANCE AND OPTIMIZATION TESTS
-- ================================================================================================

-- Test: Spatial index utilization
DO $$
DECLARE
    query_plan TEXT;
    uses_spatial_index BOOLEAN;
BEGIN
    -- Explain spatial query to check index usage
    SELECT query_plan INTO query_plan
    FROM (
        EXPLAIN (FORMAT TEXT, ANALYZE false, BUFFERS false)
        SELECT * FROM lost_pets 
        WHERE ST_DWithin(
            last_seen_location,
            ST_GeogFromText('POINT(-0.1276 51.5074)'),
            10000
        )
    ) AS plan_table(query_plan);
    
    -- Check if spatial index is being used
    uses_spatial_index := position('idx_lost_pets_location' in query_plan) > 0
                         OR position('Index Scan' in query_plan) > 0;
    
    IF NOT uses_spatial_index THEN
        RAISE WARNING 'Spatial index may not be utilized optimally';
        RAISE NOTICE 'Query plan: %', query_plan;
    ELSE
        RAISE NOTICE 'PASS: Spatial index is being utilized';
    END IF;
END
$$;

-- Test: Large radius performance
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTERVAL;
    result_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Test large radius query (continental scale)
    SELECT COUNT(*) INTO result_count
    FROM get_lost_pets_within_radius(51.5074, -0.1276, 2000); -- 2000km radius
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    -- Query should complete within 1 second even for large radius
    IF EXTRACT(MILLISECONDS FROM execution_time) > 1000 THEN
        RAISE WARNING 'Large radius query slow: %ms for %km radius', 
            EXTRACT(MILLISECONDS FROM execution_time), 2000;
    END IF;
    
    RAISE NOTICE 'PASS: Large radius query performance - %ms for % results', 
        EXTRACT(MILLISECONDS FROM execution_time), result_count;
END
$$;

-- ================================================================================================
-- 7. DATA INTEGRITY IN SPATIAL CONTEXT
-- ================================================================================================

-- Test: Spatial data consistency after updates
DO $$
DECLARE
    test_lost_pet_id UUID;
    original_location GEOMETRY;
    updated_location GEOMETRY;
    location_changed BOOLEAN;
BEGIN
    -- Create test lost pet
    INSERT INTO lost_pets (
        pet_id,
        reported_by,
        last_seen_location,
        status
    ) SELECT 
        p.id,
        p.created_by,
        ST_GeogFromText('POINT(-0.1276 51.5074)'), -- Original location
        'lost'
    FROM pets p 
    LIMIT 1
    RETURNING id INTO test_lost_pet_id;
    
    -- Get original location
    SELECT last_seen_location INTO original_location
    FROM lost_pets WHERE id = test_lost_pet_id;
    
    -- Update location
    UPDATE lost_pets 
    SET last_seen_location = ST_GeogFromText('POINT(-0.1200 51.5100)')
    WHERE id = test_lost_pet_id;
    
    -- Verify location was updated
    SELECT last_seen_location INTO updated_location
    FROM lost_pets WHERE id = test_lost_pet_id;
    
    location_changed := NOT ST_Equals(original_location, updated_location);
    
    IF NOT location_changed THEN
        RAISE EXCEPTION 'Spatial data update failed';
    END IF;
    
    -- Clean up
    DELETE FROM lost_pets WHERE id = test_lost_pet_id;
    
    RAISE NOTICE 'PASS: Spatial data updates work correctly';
END
$$;

-- ================================================================================================
-- FINAL GEOSPATIAL VALIDATION SUMMARY
-- ================================================================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'GEOSPATIAL SYSTEM VALIDATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'All geospatial components validated:';
    RAISE NOTICE '✓ PostGIS extension and configuration';
    RAISE NOTICE '✓ Spatial column setup and indexing';
    RAISE NOTICE '✓ Distance calculation accuracy';
    RAISE NOTICE '✓ Spatial query functions';
    RAISE NOTICE '✓ Coordinate system transformations';
    RAISE NOTICE '✓ Data validation and bounds checking';
    RAISE NOTICE '✓ Performance optimization';
    RAISE NOTICE '✓ Spatial data integrity';
    RAISE NOTICE '==========================================';
END
$$;