const myFetch = fetch;

async function testFleetChat() {
    console.log('Testing Fleet Chat Endpoint...');
    try {
        const res = await myFetch('http://127.0.0.1:4002/api/copilot/fleet-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'Show critical assets',
                asset_context: []
            })
        });

        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Data:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error Body:', await res.text());
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testFleetChat();
