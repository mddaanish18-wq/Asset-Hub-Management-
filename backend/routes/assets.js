const express = require('express');
const router = express.Router();
const db = require('../db');

// Mock Data Generator (Helper)
// In a real app, this might be a seed script, but we'll check and seed on first run if empty
// For now, simple endpoints

router.get('/', (req, res) => {
    const { region, type, risk } = req.query;
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params = [];

    if (region) {
        query += ' AND region = ?';
        params.push(region);
    }
    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }
    if (risk) {
        query += ' AND risk_level = ?';
        params.push(risk);
    }

    query += ' ORDER BY last_updated DESC';
    const assets = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsedAssets = assets.map(a => ({
        ...a,
        sensor_trends: JSON.parse(a.sensor_trends || '{}')
    }));

    res.json(parsedAssets);
});

router.get('/:id', (req, res) => {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (asset) {
        asset.sensor_trends = JSON.parse(asset.sensor_trends || '{}');
        res.json(asset);
    } else {
        res.status(404).json({ error: 'Asset not found' });
    }
});

module.exports = router;
