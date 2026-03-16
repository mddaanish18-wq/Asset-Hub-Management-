// Native fetch check
const myFetch = fetch;

async function testRCA() {
    console.log('Testing RCA Endpoint...');
    try {
        const res = await myFetch('http://127.0.0.1:4002/api/copilot/rca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asset_id: 'TRK-45000' })
        });

        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('RCA Data:', data);
        } else {
            console.log('Error Body:', await res.text());
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testRCA();
