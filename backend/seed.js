const db = require('./db');

const REGIONS = ['Midwest', 'Northeast', 'South', 'West'];
const TYPES = ['Tractor', 'Trailer', 'Van'];
const RISKS = ['Critical', 'High', 'Medium', 'Low'];
const FAILURES = ['Brake pads', 'Engine Overheat', 'Battery Voltage', 'Tire Pressure', 'Transmission Fluid'];

function seed() {
    console.log('Seeding database...');

    // Clear existing
    // Clear existing data (order matters for Foreign Keys)
    try {
        db.prepare('DELETE FROM actions').run();
        db.prepare('DELETE FROM telemetry_events').run();
        db.prepare('DELETE FROM prediction_requests').run();
        db.prepare('DELETE FROM assets').run();
    } catch (e) {
        console.warn('Error clearing tables:', e.message);
    }

    const insert = db.prepare(`
    INSERT INTO assets (id, region, type, health_score, risk_level, predicted_failure, sensor_trends, confidence, technician_notes, last_updated)
    VALUES (@id, @region, @type, @health_score, @risk_level, @predicted_failure, @sensor_trends, @confidence, @technician_notes, @last_updated)
  `);

    const assets = [];
    const NOTES = [
        "Driver reported noise on left front wheel",
        "Hard shifting experienced during uphill climb",
        "AC not cooling effectively",
        "Brake pedal feels spongy",
        "Vibration felt at high speeds",
        "Check engine light intermittent",
        "No issues reported",
        "Driver noted smooth operation",
        "Tires look worn",
        "Fluid leak observed near rear axle"
    ];

    for (let i = 0; i < 50; i++) {
        const health = Math.floor(Math.random() * 100);
        const riskIndex = health < 30 ? 0 : health < 60 ? 1 : health < 85 ? 2 : 3;
        const isCritical = riskIndex <= 1;

        const type = TYPES[Math.floor(Math.random() * TYPES.length)];
        let prefix = 'TRK';
        if (type === 'Trailer') prefix = 'TRL';
        if (type === 'Van') prefix = 'VAN';

        const asset = {
            id: `${prefix}-${45000 + i}`,
            region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
            type: type,
            health_score: health,
            risk_level: RISKS[riskIndex],
            predicted_failure: isCritical ? `${FAILURES[Math.floor(Math.random() * FAILURES.length)]}: 48hrs` : 'None',
            sensor_trends: JSON.stringify({
                vibration: (Math.random() * 10).toFixed(1),
                temp: Math.floor(60 + Math.random() * 40),
                fuel: (Math.random() * 10).toFixed(1)
            }),
            confidence: isCritical ? 'High' : 'Low',
            technician_notes: NOTES[Math.floor(Math.random() * NOTES.length)],
            last_updated: new Date(Date.now() - Math.floor(Math.random() * 48 * 60 * 60 * 1000)).toISOString()
        };

        insert.run(asset);
    }

    console.log('Seeded 50 assets.');
}

seed();
