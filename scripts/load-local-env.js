const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const roots = [process.cwd(), path.resolve(__dirname, '..')];
const loaded = new Set();

for (const root of roots) {
  for (const fileName of ['.env.local', '.env']) {
    const envPath = path.resolve(root, fileName);
    if (!loaded.has(envPath) && fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, quiet: true });
      loaded.add(envPath);
    }
  }
}
