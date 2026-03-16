const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/events', (req, res) => {
    const events = req.body; // Array of events

    if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: 'Events must be a non-empty array' });
    }

    // ✅ BATCH INSERT TO DATABASE
    try {
        const stmt = db.prepare(`
            INSERT INTO telemetry_events (asset_id, event_type, event_data)
            VALUES (?, ?, ?)
        `);

        // Use transaction for better performance with multiple inserts
        const insertMany = db.transaction((events) => {
            for (const event of events) {
                stmt.run(
                    event.asset_id || 'UNKNOWN',
                    event.event_type || 'generic',
                    JSON.stringify(event.data || {})
                );
            }
        });

        insertMany(events);

        console.log(`Saved ${events.length} telemetry events to database`);
        res.json({
            status: 'ingested',
            count: events.length,
            saved: true
        });
    } catch (error) {
        console.error('Error saving telemetry events:', error);
        res.json({
            status: 'ingested',
            count: events.length,
            saved: false,
            error: 'Failed to save to database'
        });
    }
});

// GET endpoint to retrieve recent telemetry for an asset
router.get('/recent/:asset_id', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const events = db.prepare(`
            SELECT * FROM telemetry_events
            WHERE asset_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(req.params.asset_id, limit);

        // Parse JSON fields
        const parsed = events.map(e => ({
            ...e,
            event_data: JSON.parse(e.event_data || '{}')
        }));

        res.json({ success: true, events: parsed });
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

module.exports = router;
