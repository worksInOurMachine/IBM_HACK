const crypto = require('crypto');

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates a generic account ID (e.g., ACC-12345)
 * For simulation, we want a pool of active accounts to simulate recurring transactions.
 * @param {number} poolSize Number of distinct accounts in the simulation
 * @returns {string} pseudo-random account ID
 */
const generateAccountId = (poolSize = 10000) => {
    const id = randomInt(1, poolSize);
    return `ACC-${id.toString().padStart(6, '0')}`;
};

/**
 * Common locations for transactions
 */
const LOCATIONS = [
    'New York, NY', 'San Francisco, CA', 'Austin, TX', 'London, UK',
    'Tokyo, JP', 'Sydney, AU', 'Paris, FR', 'Berlin, DE', 'Toronto, CA',
    'Singapore, SG'
];

/**
 * Generates mock transaction data
 * @param {number} accountPoolSize
 * @returns {Object} simulated raw transaction properties
 */
const generateMockTransactionData = (accountPoolSize = 10000) => {
    return {
        timestamp: Date.now(),
        transactionId: crypto.randomUUID(),
        accountId: generateAccountId(accountPoolSize),
        transactionType: Math.random() > 0.3 ? 'DEBIT' : 'CREDIT', // 70% DEBIT, 30% CREDIT
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
