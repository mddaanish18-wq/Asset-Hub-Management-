
async function testEndpoints() {
    try {
        console.log('Testing /api/assets sorting...');

        // Use global fetch (available in Node 24.x)
        const res = await fetch('http://127.0.0.1:4000/api/assets');

        if (!res.ok) {
            console.error(`Status: ${res.status}`);
            return;
        }

        const assets = await res.json();
        console.log(`Fetched ${assets.length} assets.`);

        if (assets.length > 0) {
            const first = new Date(assets[0].last_updated).getTime();
            const last = new Date(assets[assets.length - 1].last_updated).getTime();
            console.log('First Asset Updated:', assets[0].last_updated);
            console.log('Last Asset Updated:', assets[assets.length - 1].last_updated);

            if (first >= last) {
                console.log('✅ Assets appear to be sorted descending.');
            } else {
                console.log('❌ Assets are NOT sorted correctly.');
            }
        } else {
            console.log('No assets fetched to check sorting.');
        }
    } catch (e) {
        console.error(`problem with asset fetch request: ${e.message}`);
    }
}

testEndpoints();
