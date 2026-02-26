const crypto = require('crypto');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateAccountId = (poolSize = 10000) => {
    const id = randomInt(1, poolSize);
    return `ACC-${id.toString().padStart(12, '0')}`;
};

const LOCATIONS = [
    'New York, NY', 'San Francisco, CA', 'Austin, TX', 'London, UK',
    'Tokyo, JP', 'Sydney, AU', 'Paris, FR', 'Berlin, DE', 'Toronto, CA',
    'Singapore, SG'
];

const generateMockTransactionData = (accountPoolSize = 10000) => {
    return {
        timestamp: Date.now(),
        transactionId: crypto.randomUUID(),
        accountId: generateAccountId(accountPoolSize),
        transactionType: Math.random() > 0.3 ? 'DEBIT' : 'CREDIT',
        amount: parseFloat((Math.random() * 5000 + 1).toFixed(2)),
        location: LOCATIONS[randomInt(0, LOCATIONS.length - 1)],
        deviceId: `DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    };
};

module.exports = {
    randomInt,
    generateAccountId,
    generateMockTransactionData
};
