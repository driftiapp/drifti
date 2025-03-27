-- Create component_data table
CREATE TABLE IF NOT EXISTS component_data (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create weather_data table
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    humidity DOUBLE PRECISION NOT NULL,
    pressure DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_traffic table
CREATE TABLE IF NOT EXISTS user_traffic (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system_load table
CREATE TABLE IF NOT EXISTS system_load (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create model_predictions table
CREATE TABLE IF NOT EXISTS model_predictions (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feature_importance table
CREATE TABLE IF NOT EXISTS feature_importance (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    importance DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create structural_breaks table
CREATE TABLE IF NOT EXISTS structural_breaks (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    type VARCHAR(50) NOT NULL,
    magnitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create model_performance table
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    component_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    residual_mean DOUBLE PRECISION NOT NULL,
    residual_std DOUBLE PRECISION NOT NULL,
    cv_score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_component_data_component_id ON component_data(component_id);
CREATE INDEX IF NOT EXISTS idx_component_data_timestamp ON component_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_weather_data_component_id ON weather_data(component_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp ON weather_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_traffic_component_id ON user_traffic(component_id);
CREATE INDEX IF NOT EXISTS idx_user_traffic_timestamp ON user_traffic(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_load_component_id ON system_load(component_id);
CREATE INDEX IF NOT EXISTS idx_system_load_timestamp ON system_load(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_predictions_component_id ON model_predictions(component_id);
CREATE INDEX IF NOT EXISTS idx_model_predictions_timestamp ON model_predictions(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_importance_component_id ON feature_importance(component_id);
CREATE INDEX IF NOT EXISTS idx_structural_breaks_component_id ON structural_breaks(component_id);
CREATE INDEX IF NOT EXISTS idx_structural_breaks_timestamp ON structural_breaks(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_performance_component_id ON model_performance(component_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_timestamp ON model_performance(timestamp);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_component_data_component_timestamp ON component_data(component_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_weather_data_component_timestamp ON weather_data(component_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_traffic_component_timestamp ON user_traffic(component_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_system_load_component_timestamp ON system_load(component_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_model_predictions_component_timestamp ON model_predictions(component_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_structural_breaks_component_timestamp ON structural_breaks(component_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_model_performance_component_timestamp ON model_performance(component_id, timestamp);

-- Create views for common queries
CREATE OR REPLACE VIEW component_metrics AS
SELECT 
    cd.component_id,
    cd.timestamp,
    cd.value as component_value,
    wd.temperature,
    wd.humidity,
    wd.pressure,
    ut.value as user_traffic,
    sl.value as system_load,
    mp.value as prediction,
    fi.feature_name,
    fi.importance as feature_importance,
    sb.type as break_type,
    sb.magnitude as break_magnitude,
    mper.residual_mean,
    mper.residual_std,
    mper.cv_score
FROM component_data cd
LEFT JOIN weather_data wd ON cd.component_id = wd.component_id AND cd.timestamp = wd.timestamp
LEFT JOIN user_traffic ut ON cd.component_id = ut.component_id AND cd.timestamp = ut.timestamp
LEFT JOIN system_load sl ON cd.component_id = sl.component_id AND cd.timestamp = sl.timestamp
LEFT JOIN model_predictions mp ON cd.component_id = mp.component_id AND cd.timestamp = mp.timestamp
LEFT JOIN feature_importance fi ON cd.component_id = fi.component_id
LEFT JOIN structural_breaks sb ON cd.component_id = sb.component_id AND cd.timestamp = sb.timestamp
LEFT JOIN model_performance mper ON cd.component_id = mper.component_id AND cd.timestamp = mper.timestamp;

-- Create function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER)
RETURNS void AS $$
BEGIN
    DELETE FROM component_data WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
    DELETE FROM weather_data WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
    DELETE FROM user_traffic WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
    DELETE FROM system_load WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
    DELETE FROM model_predictions WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
    DELETE FROM structural_breaks WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
    DELETE FROM model_performance WHERE timestamp < NOW() - (days_old || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job for data cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('0 0 * * *', $$
    SELECT cleanup_old_data(90);
$$); 