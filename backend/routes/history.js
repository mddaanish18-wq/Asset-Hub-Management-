const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all saved AI plans/scenarios
router.get('/plans', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const scenarios = db.prepare(`
            SELECT id, asset_ids, user_prompt, plan_details, created_at
            FROM scenarios
            ORDER BY created_at DESC
            LIMIT ?
        `).all(limit);

        const parsed = scenarios.map(s => ({
            id: s.id,
            asset_ids: JSON.parse(s.asset_ids || '[]'),
            user_prompt: s.user_prompt,
            plan_details: JSON.parse(s.plan_details || '{}'),
            created_at: s.created_at
        }));

        res.json({ success: true, count: parsed.length, plans: parsed });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// GET all prediction requests
router.get('/predictions', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const predictions = db.prepare(`
            SELECT * FROM prediction_requests
            ORDER BY created_at DESC
            LIMIT ?
        `).all(limit);

        const parsed = predictions.map(p => ({
            ...p,
            prediction_result: JSON.parse(p.prediction_result || '{}')
        }));

        res.json({ success: true, count: parsed.length, predictions: parsed });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

// GET all telemetry events
router.get('/telemetry', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 200;
        const events = db.prepare(`
            SELECT * FROM telemetry_events
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(limit);

        const parsed = events.map(e => ({
            ...e,
            event_data: JSON.parse(e.event_data || '{}')
        }));

        res.json({ success: true, count: parsed.length, events: parsed });
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// GET aggregated statistics
router.get('/stats', (req, res) => {
    try {
        const stats = {
            total_plans: db.prepare('SELECT COUNT(*) as count FROM scenarios').get().count,
            total_predictions: db.prepare('SELECT COUNT(*) as count FROM prediction_requests').get().count,
            total_telemetry_events: db.prepare('SELECT COUNT(*) as count FROM telemetry_events').get().count,
            total_user_actions: db.prepare('SELECT COUNT(*) as count FROM user_actions').get().count,
            recent_activity: {
                plans_last_24h: db.prepare(`
                    SELECT COUNT(*) as count FROM scenarios 
                    WHERE created_at > datetime('now', '-1 day')
                `).get().count,
                predictions_last_24h: db.prepare(`
                    SELECT COUNT(*) as count FROM prediction_requests 
                    WHERE created_at > datetime('now', '-1 day')
                `).get().count
            }
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
