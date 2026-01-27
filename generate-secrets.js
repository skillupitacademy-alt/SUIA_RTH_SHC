const crypto = require('crypto');

function generateSecret(key) {
    console.log(`${key}=${crypto.randomBytes(64).toString('hex')}`);
}

generateSecret('JWT_SECRET');
generateSecret('JWT_REFRESH_SECRET');
generateSecret('ADMIN_JWT_SECRET');
generateSecret('CSRF_SECRET');
