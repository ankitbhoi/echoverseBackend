const crypto = require('crypto');

class HashService {
    hashOtp(data) {
        const hashSecret = process.env.HASH_SECRET;
        return crypto.createHmac('sha256', hashSecret).update(data).digest('hex');
    }
}

module.exports = new HashService();
