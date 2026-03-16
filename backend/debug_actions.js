const db = require('./db');

try {
    const actions = db.prepare('SELECT * FROM actions').all();
    console.log('--- ACTIONS TABLE DUMP ---');
    console.log(JSON.stringify(actions, null, 2));
    console.log('--- END DUMP ---');
} catch (error) {
    console.error('Error reading DB:', error);
}
