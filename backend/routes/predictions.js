const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
    const { asset_id, description, horizon_hours } = req.body;

    // Mock prediction logic
    const predictionResult = {
        asset_id,
        failure_probability: 0.85,
        predicted_component: 'Brake System',
        time_to_failure: `${horizon_hours || 48}h`
    };

    // ✅ PERSIST TO DATABASE
    try {
        const stmt = db.prepare(`
            INSERT INTO prediction_requests (asset_id, description, horizon_hours, prediction_result)
            VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(
            asset_id,
            description || 'No description',
            horizon_hours || 48,
            JSON.stringify(predictionResult)
        );

        console.log(`Prediction saved for ${asset_id} (ID: ${result.lastInsertRowid})`);

        res.json({
            status: 'success',
            prediction: predictionResult,
            saved: true,
            request_id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error saving prediction:', error);
        // Still return prediction even if save fails
        res.json({
            status: 'success',
            prediction: predictionResult,
            saved: false,
            error: 'Failed to save to database'
        });
    }
});

// GET endpoint to retrieve prediction history for an asset
router.get('/history/:asset_id', (req, res) => {
    try {
        const predictions = db.prepare(`
            SELECT * FROM prediction_requests
            WHERE asset_id = ?
            ORDER BY created_at DESC
        `).all(req.params.asset_id);

        // Parse JSON fields
        const parsed = predictions.map(p => ({
            ...p,
            prediction_result: JSON.parse(p.prediction_result || '{}')
        }));

        res.json({ success: true, predictions: parsed });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

module.exports = router;
