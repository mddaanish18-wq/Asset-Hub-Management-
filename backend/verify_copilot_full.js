// Native fetch in Node 18+

const BASE_URL = 'http://localhost:4000/api/copilot';

async function testEndpoint(name, url, method, body = null) {
    console.log(`\nTesting ${name}...`);
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ ${name} Success!`);
            // console.log(JSON.stringify(data, null, 2).substring(0, 200) + '...');
            if (data.executive_summary) console.log('Summary Preview:', data.executive_summary.substring(0, 100));
            if (data.plan_summary) console.log('Plan Preview:', data.plan_summary.substring(0, 100));
            if (data.root_cause_summary) console.log('RCA Preview:', data.root_cause_summary.substring(0, 100));
            if (data.answer) console.log('Chat Answer:', data.answer);
            return true;
        } else {
            console.error(`❌ ${name} Failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return false;
        }
    } catch (err) {
        console.error(`❌ ${name} Error:`, err.message);
        return false;
    }
}

async function runVerification() {
    console.log('🚀 Starting GenAI Copilot Verification...');

    // 1. Generate Plan
    const planSuccess = await testEndpoint('Generate Plan', `${BASE_URL}/plan`, 'POST', { asset_ids: ['TRK-1501', 'TRL-8890'] });

    // 2. RCA
    const rcaSuccess = await testEndpoint('Run RCA', `${BASE_URL}/rca`, 'POST', { asset_id: 'TRK-1501', failure_type: 'Brake Failure' });

    // 3. Chat
    const chatSuccess = await testEndpoint('Tech Chat', `${BASE_URL}/chat`, 'POST', {
        asset_id: 'TRK-1501',
        message: 'What is the recommended torque?',
        context: { type: 'Tractor', make: 'Freightliner' }
    });

    // 4. Executive Summary
    const summarySuccess = await testEndpoint('Executive Summary', `${BASE_URL}/summary`, 'GET');

    if (planSuccess && rcaSuccess && chatSuccess && summarySuccess) {
        console.log('\n✨ All GenAI Copilot Checks Passed!');
    } else {
        console.error('\n⚠️ Some checks failed.');
    }
}

runVerification();
