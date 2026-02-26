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
