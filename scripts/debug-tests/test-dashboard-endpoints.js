
async function test() {
  try {
    console.log('Logging in...');
    const guestRes = await fetch('http://localhost:3001/api/auth/guest', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' }
    });
    
    let token;
    if (guestRes.ok) {
        const guestData = await guestRes.json();
        token = guestData.data?.tokens?.accessToken || guestData.token;
        console.log('Guest login success');
    } else {
        console.error('Guest login failed');
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };
    const endpoints = [
        '/api/dashboard/kpis?tenant=default',
        '/api/dashboard/policy-status',
        '/api/dashboard/alerts?tenant=default',
        '/api/lab/experiments?tenant=default'
    ];

    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint}...`);
        const res = await fetch(`http://localhost:3001${endpoint}`, { headers });
        console.log(`Status: ${res.status}`);
        if (res.status !== 200) {
            console.log('Error Body:', await res.text());
        }
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

test();
