
async function test() {
  try {
    console.log('Logging in...');
    // Try guest login
    const guestRes = await fetch('http://localhost:3001/api/auth/guest', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' }
    });
    
    let token;
    if (guestRes.ok) {
        const guestData = await guestRes.json();
        // Adjust based on actual response structure
        token = guestData.data?.tokens?.accessToken || guestData.token;
        console.log('Guest login success:', !!token);
    } else {
        console.log('Guest login failed:', await guestRes.text());
        return;
    }

    if (!token) {
        console.error('Could not get token');
        return;
    }

    console.log('Fetching Overseer Status...');
    const res = await fetch('http://localhost:3001/api/overseer/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Status:', res.status);
    console.log('Body:', await res.text());

  } catch (e) {
    console.error('Error:', e);
  }
}

test();
