const { sequelize } = require('./database');

// Create continuous aggregates for hourly and daily metrics
async function createContinuousAggregates() {
    try {
        // Hourly aggregate
        await sequelize.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS post_metrics_hourly
            WITH (timescaledb.continuous) AS
            SELECT 
                time_bucket('1 hour', time) AS bucket,
                post_id,
                user_id,
                SUM(views) as total_views,
                SUM(likes) as total_likes,
                SUM(comments) as total_comments,
                SUM(shares) as total_shares
            FROM post_metrics
            GROUP BY bucket, post_id, user_id;

            SELECT add_continuous_aggregate_policy('post_metrics_hourly',
                start_offset => INTERVAL '1 hour',
                end_offset => INTERVAL '1 minute',
                schedule_interval => INTERVAL '1 hour');
        `);

        // Daily aggregate
        await sequelize.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS post_metrics_daily
            WITH (timescaledb.continuous) AS
            SELECT 
                time_bucket('1 day', time) AS bucket,
                post_id,
                user_id,
                SUM(views) as total_views,
                SUM(likes) as total_likes,
                SUM(comments) as total_comments,
                SUM(shares) as total_shares
            FROM post_metrics
            GROUP BY bucket, post_id, user_id;

            SELECT add_continuous_aggregate_policy('post_metrics_daily',
                start_offset => INTERVAL '1 day',
                end_offset => INTERVAL '1 hour',
                schedule_interval => INTERVAL '1 day');
        `);

        console.log('Continuous aggregates created successfully');
    } catch (error) {
        console.error('Error creating continuous aggregates:', error);
        throw error;
    }
}

// Set up data retention policy
async function setupRetentionPolicy() {
    try {
        // Keep detailed data for 7 days
        await sequelize.query(`
            SELECT add_retention_policy('post_metrics', INTERVAL '7 days');
        `);

        // Keep hourly aggregates for 30 days
        await sequelize.query(`
            SELECT add_retention_policy('post_metrics_hourly', INTERVAL '30 days');
        `);

        // Keep daily aggregates for 1 year
        await sequelize.query(`
            SELECT add_retention_policy('post_metrics_daily', INTERVAL '1 year');
        `);

        console.log('Retention policies set up successfully');
    } catch (error) {
        console.error('Error setting up retention policies:', error);
        throw error;
    }
}

// Create compression policy
async function setupCompressionPolicy() {
    try {
        // Compress data older than 7 days
        await sequelize.query(`
            ALTER TABLE post_metrics SET (
                timescaledb.compress = true,
                timescaledb.compress_segmentby = 'post_id, user_id',
                timescaledb.compress_orderby = 'time DESC'
            );

            SELECT add_compression_policy('post_metrics', INTERVAL '7 days');
        `);

        console.log('Compression policy set up successfully');
    } catch (error) {
        console.error('Error setting up compression policy:', error);
        throw error;
    }
}

// Refresh continuous aggregates
async function refreshContinuousAggregates() {
    try {
        await sequelize.query(`
            CALL refresh_continuous_aggregate('post_metrics_hourly', NULL, NULL);
            CALL refresh_continuous_aggregate('post_metrics_daily', NULL, NULL);
        `);
        console.log('Continuous aggregates refreshed successfully');
    } catch (error) {
        console.error('Error refreshing continuous aggregates:', error);
        throw error;
    }
}

module.exports = {
    createContinuousAggregates,
    setupRetentionPolicy,
    setupCompressionPolicy,
    refreshContinuousAggregates
}; 