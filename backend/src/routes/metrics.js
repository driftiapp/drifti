const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { refreshContinuousAggregates } = require('../config/timescale');

// Get metrics for a specific post
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { interval = '1 hour' } = req.query;

        // Use continuous aggregate for hourly data
        if (interval === '1 hour') {
            const metrics = await sequelize.query(`
                SELECT 
                    bucket,
                    total_views,
                    total_likes,
                    total_comments,
                    total_shares,
                    VARIANCE(total_views) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as views_variance,
                    VARIANCE(total_likes) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as likes_variance,
                    VARIANCE(total_comments) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as comments_variance,
                    VARIANCE(total_shares) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as shares_variance
                FROM post_metrics_hourly
                WHERE post_id = $1
                ORDER BY bucket DESC
                LIMIT 24
            `, {
                bind: [postId],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(metrics);
        } 
        // Use continuous aggregate for daily data
        else if (interval === '1 day') {
            const metrics = await sequelize.query(`
                SELECT 
                    bucket,
                    total_views,
                    total_likes,
                    total_comments,
                    total_shares,
                    VARIANCE(total_views) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as views_variance,
                    VARIANCE(total_likes) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as likes_variance,
                    VARIANCE(total_comments) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as comments_variance,
                    VARIANCE(total_shares) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as shares_variance
                FROM post_metrics_daily
                WHERE post_id = $1
                ORDER BY bucket DESC
                LIMIT 30
            `, {
                bind: [postId],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(metrics);
        }
        // Use raw table for custom intervals
        else {
            const metrics = await sequelize.query(`
                SELECT 
                    time_bucket($1, time) as bucket,
                    SUM(views) as total_views,
                    SUM(likes) as total_likes,
                    SUM(comments) as total_comments,
                    SUM(shares) as total_shares,
                    VARIANCE(SUM(views)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as views_variance,
                    VARIANCE(SUM(likes)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as likes_variance,
                    VARIANCE(SUM(comments)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as comments_variance,
                    VARIANCE(SUM(shares)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as shares_variance
                FROM post_metrics
                WHERE post_id = $2
                GROUP BY bucket
                ORDER BY bucket DESC
                LIMIT 24
            `, {
                bind: [interval, postId],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(metrics);
        }
    } catch (error) {
        console.error('Error fetching post metrics:', error);
        res.status(500).json({ error: 'Failed to fetch post metrics' });
    }
});

// Get metrics for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { interval = '1 hour' } = req.query;

        // Use continuous aggregate for hourly data
        if (interval === '1 hour') {
            const metrics = await sequelize.query(`
                SELECT 
                    bucket,
                    COUNT(DISTINCT post_id) as total_posts,
                    SUM(total_views) as total_views,
                    SUM(total_likes) as total_likes,
                    SUM(total_comments) as total_comments,
                    SUM(total_shares) as total_shares,
                    VARIANCE(SUM(total_views)) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as views_variance,
                    VARIANCE(SUM(total_likes)) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as likes_variance,
                    VARIANCE(SUM(total_comments)) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as comments_variance,
                    VARIANCE(SUM(total_shares)) OVER (ORDER BY bucket ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as shares_variance
                FROM post_metrics_hourly
                WHERE user_id = $1
                GROUP BY bucket
                ORDER BY bucket DESC
                LIMIT 24
            `, {
                bind: [userId],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(metrics);
        }
        // Use continuous aggregate for daily data
        else if (interval === '1 day') {
            const metrics = await sequelize.query(`
                SELECT 
                    bucket,
                    COUNT(DISTINCT post_id) as total_posts,
                    SUM(total_views) as total_views,
                    SUM(total_likes) as total_likes,
                    SUM(total_comments) as total_comments,
                    SUM(total_shares) as total_shares,
                    VARIANCE(SUM(total_views)) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as views_variance,
                    VARIANCE(SUM(total_likes)) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as likes_variance,
                    VARIANCE(SUM(total_comments)) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as comments_variance,
                    VARIANCE(SUM(total_shares)) OVER (ORDER BY bucket ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as shares_variance
                FROM post_metrics_daily
                WHERE user_id = $1
                GROUP BY bucket
                ORDER BY bucket DESC
                LIMIT 30
            `, {
                bind: [userId],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(metrics);
        }
        // Use raw table for custom intervals
        else {
            const metrics = await sequelize.query(`
                SELECT 
                    time_bucket($1, time) as bucket,
                    COUNT(DISTINCT post_id) as total_posts,
                    SUM(views) as total_views,
                    SUM(likes) as total_likes,
                    SUM(comments) as total_comments,
                    SUM(shares) as total_shares,
                    VARIANCE(SUM(views)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as views_variance,
                    VARIANCE(SUM(likes)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as likes_variance,
                    VARIANCE(SUM(comments)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as comments_variance,
                    VARIANCE(SUM(shares)) OVER (ORDER BY time_bucket($1, time) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as shares_variance
                FROM post_metrics
                WHERE user_id = $2
                GROUP BY bucket
                ORDER BY bucket DESC
                LIMIT 24
            `, {
                bind: [interval, userId],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(metrics);
        }
    } catch (error) {
        console.error('Error fetching user metrics:', error);
        res.status(500).json({ error: 'Failed to fetch user metrics' });
    }
});

// Record new metrics
router.post('/', async (req, res) => {
    try {
        const { post_id, user_id, views, likes, comments, shares } = req.body;

        await sequelize.query(`
            INSERT INTO post_metrics (
                time, post_id, user_id, views, likes, comments, shares
            ) VALUES (
                NOW(), $1, $2, $3, $4, $5, $6
            )
        `, {
            bind: [post_id, user_id, views, likes, comments, shares],
            type: sequelize.QueryTypes.INSERT
        });

        // Refresh continuous aggregates
        await refreshContinuousAggregates();

        res.status(201).json({ message: 'Metrics recorded successfully' });
    } catch (error) {
        console.error('Error recording metrics:', error);
        res.status(500).json({ error: 'Failed to record metrics' });
    }
});

// Get trending posts
router.get('/trending', async (req, res) => {
    try {
        const { interval = '24 hours' } = req.query;

        // Use hourly aggregate for recent data
        if (interval === '24 hours') {
            const trending = await sequelize.query(`
                SELECT 
                    post_id,
                    SUM(total_views) as total_views,
                    SUM(total_likes) as total_likes,
                    SUM(total_comments) as total_comments,
                    SUM(total_shares) as total_shares,
                    SUM(total_views + total_likes * 2 + total_comments * 3 + total_shares * 4) as engagement_score,
                    VARIANCE(total_views + total_likes * 2 + total_comments * 3 + total_shares * 4) as engagement_variance
                FROM post_metrics_hourly
                WHERE bucket > NOW() - $1::interval
                GROUP BY post_id
                ORDER BY engagement_score DESC
                LIMIT 10
            `, {
                bind: [interval],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(trending);
        }
        // Use daily aggregate for longer periods
        else if (interval === '7 days' || interval === '30 days') {
            const trending = await sequelize.query(`
                SELECT 
                    post_id,
                    SUM(total_views) as total_views,
                    SUM(total_likes) as total_likes,
                    SUM(total_comments) as total_comments,
                    SUM(total_shares) as total_shares,
                    SUM(total_views + total_likes * 2 + total_comments * 3 + total_shares * 4) as engagement_score,
                    VARIANCE(total_views + total_likes * 2 + total_comments * 3 + total_shares * 4) as engagement_variance
                FROM post_metrics_daily
                WHERE bucket > NOW() - $1::interval
                GROUP BY post_id
                ORDER BY engagement_score DESC
                LIMIT 10
            `, {
                bind: [interval],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(trending);
        }
        // Use raw table for custom intervals
        else {
            const trending = await sequelize.query(`
                SELECT 
                    post_id,
                    SUM(views) as total_views,
                    SUM(likes) as total_likes,
                    SUM(comments) as total_comments,
                    SUM(shares) as total_shares,
                    SUM(views + likes * 2 + comments * 3 + shares * 4) as engagement_score,
                    VARIANCE(views + likes * 2 + comments * 3 + shares * 4) as engagement_variance
                FROM post_metrics
                WHERE time > NOW() - $1::interval
                GROUP BY post_id
                ORDER BY engagement_score DESC
                LIMIT 10
            `, {
                bind: [interval],
                type: sequelize.QueryTypes.SELECT
            });
            res.json(trending);
        }
    } catch (error) {
        console.error('Error fetching trending posts:', error);
        res.status(500).json({ error: 'Failed to fetch trending posts' });
    }
});

module.exports = router; 