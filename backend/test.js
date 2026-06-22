const query = `[out:json][timeout:25];
  (
    node["amenity"="restaurant"]["name"~"Spice",i](18.34,73.72,18.62,73.98);
  );
  out center 100;`;

fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'secondServe-App/1.0 (pvjadhav2513@gmail.com)'
  },
  body: 'data=' + encodeURIComponent(query)
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
