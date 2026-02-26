/**
 * Represents a single financial transaction.
 * Uses ES6 class structure as requested.
 */
class Transaction {
    constructor({ timestamp, transactionId, accountId, transactionType, amount, location, deviceId }) {
        this.timestamp = timestamp;
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.transactionType = transactionType;
        this.amount = amount;
        this.location = location;
        this.deviceId = deviceId;
    }

    /**
     * Determine if transaction is older than a specified duration in milliseconds
     * @param {number} durationMs 
     * @param {number} currentTime 
     * @returns {boolean}
     */
    isOlderThan(durationMs, currentTime = Date.now()) {
        return (currentTime - this.timestamp) > durationMs;
    }

    toJSON() {
        return {
            timestamp: this.timestamp,
            transactionId: this.transactionId,
            accountId: this.accountId,
            transactionType: this.transactionType,
            amount: this.amount,
            location: this.location,
            deviceId: this.deviceId
        };
    }
}

module.exports = Transaction;
