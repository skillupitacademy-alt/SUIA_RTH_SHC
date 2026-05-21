async function run() {
  try {
    console.log('Requesting localhost:3007...');
    const res = await fetch('http://localhost:3007/');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body preview:', text.substring(0, 1000));
  } catch (err) {
    console.error('Error fetching dev server:', err);
  }
}

run();
