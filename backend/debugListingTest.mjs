import fetch from 'node-fetch';

const base = 'http://127.0.0.1:4000';
const registerBody = {
  name: 'Test Donor',
  email: 'testdonor@example.com',
  password: 'Password123!',
  role: 'donor',
  location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
};

try {
  let res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerBody),
  });
  const registerData = await res.text();
  console.log('register', res.status, registerData);
  if (res.status !== 201) process.exit(1);

  const token = JSON.parse(registerData).token;
  const listingBody = {
    description: 'A tray of leftover sandwiches and salad',
    quantity: 4,
    expiryTime: new Date(Date.now() + 3600000).toISOString(),
    location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  };

  res = await fetch(`${base}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(listingBody),
  });
  const listingData = await res.text();
  console.log('listing', res.status, listingData);
} catch (error) {
  console.error('test error', error);
}
