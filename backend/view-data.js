const db = require('./db');

console.log('\n📊 UPS DASHBOARD DATABASE CONTENTS\n');
console.log('='.repeat(60));

// View Assets
console.log('\n🚛 ASSETS:');
const assets = db.prepare('SELECT * FROM assets LIMIT 10').all();
console.table(assets.map(a => ({
    ID: a.id,
    Region: a.region,
    Type: a.type,
    Health: a.health_score,
    Risk: a.risk_level,
    Failure: a.predicted_failure
})));

// View Actions
console.log('\n✅ SCHEDULED ACTIONS:');
const actions = db.prepare('SELECT * FROM actions ORDER BY created_at DESC LIMIT 10').all();
if (actions.length === 0) {
    console.log('   No actions scheduled yet. Schedule some from the frontend!');
} else {
    console.table(actions.map(a => ({
        ID: a.id,
        Asset: a.asset_id,
        Type: a.action_type,
        Priority: a.priority,
        Timeline: a.timeline,
        Status: a.status,
        Assigned: a.created_by
    })));
}

// View Scenarios (AI Plans)
console.log('\n🤖 AI COPILOT SCENARIOS:');
const scenarios = db.prepare('SELECT id, user_prompt, created_at FROM scenarios ORDER BY created_at DESC LIMIT 5').all();
if (scenarios.length === 0) {
    console.log('   No AI plans generated yet. Try the Risk Dashboard AI feature!');
} else {
    console.table(scenarios);
}

// Statistics
console.log('\n📈 STATISTICS:');
const stats = {
    'Total Assets': db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
    'Total Actions': db.prepare('SELECT COUNT(*) as count FROM actions').get().count,
    'Pending Actions': db.prepare("SELECT COUNT(*) as count FROM actions WHERE status='pending'").get().count,
    'Completed Actions': db.prepare("SELECT COUNT(*) as count FROM actions WHERE status='completed'").get().count,
    'AI Scenarios': db.prepare('SELECT COUNT(*) as count FROM scenarios').get().count
};
console.table(stats);

console.log('\n' + '='.repeat(60));
console.log('✅ Done! Database viewed successfully.\n');
