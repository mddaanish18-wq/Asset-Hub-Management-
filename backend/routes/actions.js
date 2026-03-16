const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to calculate timeline based on scheduled date
function calculateTimeline(scheduledDate) {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const hoursDiff = (scheduled - now) / (1000 * 60 * 60);

    if (hoursDiff <= 0) return 'today';
    if (hoursDiff <= 24) return 'today';
    if (hoursDiff <= 48) return '48hrs';
    return 'next_week';
}

// POST - Schedule a new maintenance action
router.post('/schedule', (req, res) => {
    const { asset_id, action_type, description, scheduled_date, priority, created_by } = req.body;

    if (!asset_id || !action_type || !scheduled_date) {
        return res.status(400).json({
            error: 'Missing required fields: asset_id, action_type, scheduled_date'
        });
    }

    try {
        // Calculate timeline
        const timeline = calculateTimeline(scheduled_date);

        // Insert into database
        const stmt = db.prepare(`
            INSERT INTO actions (asset_id, action_type, description, priority, timeline, scheduled_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            asset_id,
            action_type,
            description || '',
            priority || 'medium',
            timeline,
            scheduled_date,
            created_by || 'System'
        );

        // Get the inserted action
        const action = db.prepare('SELECT * FROM actions WHERE id = ?').get(result.lastInsertRowid);

        console.log(`✅ Action scheduled: ${action_type} for ${asset_id} (Timeline: ${timeline})`);

        res.json({
            success: true,
            action: action,
            message: `Maintenance scheduled for ${timeline}`
        });
    } catch (error) {
        console.error('Error scheduling action:', error);
        res.status(500).json({ error: 'Failed to schedule action' });
    }
});

// GET - Retrieve all actions with optional filters
router.get('/', (req, res) => {
    const { timeline, status, asset_id, priority } = req.query;

    let query = 'SELECT * FROM actions WHERE 1=1';
    const params = [];

    if (timeline) {
        query += ' AND timeline = ?';
        params.push(timeline);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (asset_id) {
        query += ' AND asset_id = ?';
        params.push(asset_id);
    }
    if (priority) {
        query += ' AND priority = ?';
        params.push(priority);
    }

    query += ' ORDER BY scheduled_date ASC';

    try {
        const actions = db.prepare(query).all(...params);
        res.json({ success: true, count: actions.length, actions });
    } catch (error) {
        console.error('Error fetching actions:', error);
        res.status(500).json({ error: 'Failed to fetch actions' });
    }
});

// GET - Retrieve a specific action by ID
router.get('/:id', (req, res) => {
    try {
        const action = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);

        if (!action) {
            return res.status(404).json({ error: 'Action not found' });
        }

        res.json({ success: true, action });
    } catch (error) {
        console.error('Error fetching action:', error);
        res.status(500).json({ error: 'Failed to fetch action' });
    }
});

// PUT - Mark action as completed
router.put('/:id/complete', (req, res) => {
    try {
        const stmt = db.prepare(`
            UPDATE actions 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        const result = stmt.run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Action not found' });
        }

        const action = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);

        console.log(`✅ Action completed: ID ${req.params.id}`);

        res.json({ success: true, action, message: 'Action marked as completed' });
    } catch (error) {
        console.error('Error completing action:', error);
        res.status(500).json({ error: 'Failed to complete action' });
    }
});

// PUT - Update action status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const stmt = db.prepare('UPDATE actions SET status = ? WHERE id = ?');
        const result = stmt.run(status, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Action not found' });
        }

        const action = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);
        res.json({ success: true, action });
    } catch (error) {
        console.error('Error updating action:', error);
        res.status(500).json({ error: 'Failed to update action' });
    }
});

// DELETE - Cancel/delete an action
router.delete('/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM actions WHERE id = ?');
        const result = stmt.run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Action not found' });
        }

        console.log(`🗑️ Action deleted: ID ${req.params.id}`);

        res.json({ success: true, message: 'Action deleted successfully' });
    } catch (error) {
        console.error('Error deleting action:', error);
        res.status(500).json({ error: 'Failed to delete action' });
    }
});

// GET - Get actions grouped by timeline
router.get('/grouped/timeline', (req, res) => {
    try {
        const actions = db.prepare(`
            SELECT * FROM actions 
            WHERE status != 'completed'
            ORDER BY scheduled_date ASC
        `).all();

        const grouped = {
            today: actions.filter(a => a.timeline === 'today'),
            '48hrs': actions.filter(a => a.timeline === '48hrs'),
            next_week: actions.filter(a => a.timeline === 'next_week'),
            overdue: actions.filter(a => a.timeline === 'overdue')
        };

        res.json({ success: true, grouped });
    } catch (error) {
        console.error('Error grouping actions:', error);
        res.status(500).json({ error: 'Failed to group actions' });
    }
});

module.exports = router;
