const db = require('./db');

try {
    const result = db.prepare("UPDATE actions SET timeline = 'today' WHERE timeline IS NULL OR timeline = ''").run();
    console.log(`✅ Fixed ${result.changes} rows with missing timeline.`);
} catch (error) {
    console.error('Error fixing DB:', error);
}
