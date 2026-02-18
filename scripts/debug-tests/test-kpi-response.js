
async function test() {
  try {
    const guestRes = await fetch('http://localhost:3001/api/auth/guest', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' }
    });
    const guestData = await guestRes.json();
    const token = guestData.data?.tokens?.accessToken || guestData.token;

    const res = await fetch('http://localhost:3001/api/dashboard/kpis?tenant=default', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(JSON.stringify(await res.json(), null, 2));

  } catch (e) {
    console.error(e);
  }
}
test();
