const bcrypt = require('bcryptjs');

async function verify() {
    const passwords = ['admin123', 'super123'];

    console.log("--- BCRYPT COMPATIBILITY TEST ---");
    for (const pw of passwords) {
        const hash = await bcrypt.hash(pw, 10);
        const match = await bcrypt.compare(pw, hash);
        console.log(`Password: ${pw}`);
        console.log(`Generated Hash: ${hash}`);
        console.log(`Self-Match Test: ${match ? "SUCCESS" : "FAILED"}`);
        console.log("--------------------");
    }
}

verify();
