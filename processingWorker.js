const { parentPort } = require('worker_threads');
const Transaction = require('./transaction');

let rxPort = null;
let txPort = null;

// The rolling window length in milliseconds (10 minutes = 600,000 ms)
const WINDOW_DURATION_MS = 10 * 60 * 1000;

/**
 * We use an array to store the rolling window in chronological order.
 * Since transactions are continuously added over time, new transactions are pushed to the end.
 * Older transactions are clustered at the beginning.
 * To optimize memory and performance, we periodically shift off expired transactions.
 */
const transactionWindow = [];

/**
 * Map structure to track aggregated statistics per account
 * Key: accountId (String)
 * Value: {
 *   totalSpending: Number (running sum of DEBIT),
 *   transactionCount: Number (number of transactions within window)
 * }
 */
const accountStats = new Map();

// Global tracking
let totalProcessedThisSession = 0;

// Listen for setup instructions
parentPort.on('message', (message) => {
    if (message.type === 'START') {
        rxPort = message.rxPort;
        txPort = message.txPort;

        setupPipeline();
    }
});

function setupPipeline() {
    console.log('[Processing Worker] Started. Managing 10-minute rolling window.');

    // Listen to incoming transactions from Ingestion
    rxPort.on('message', (msg) => {
        if (msg.type === 'TX_BATCH' && msg.data) {
            processBatch(msg.data);
        }
    });

    // Cleanup interval - remove expired transactions every 1 second
    // Doing it frequently prevents the array from getting unnecessarily large and reduces blocking time.
    setInterval(cleanupWindow, 1000);

    // Reporting interval - push stats to Reporter every 2 seconds
    setInterval(reportStats, 2000);
}

function processBatch(batch) {
    totalProcessedThisSession += batch.length;
    const now = Date.now();

    for (let i = 0; i < batch.length; i++) {
        const rawTx = batch[i];

        // Ensure it's treated as a pure ES6 Transaction class instance
        const tx = Object.setPrototypeOf(rawTx, Transaction.prototype);

        // Add to our rolling window array
        transactionWindow.push(tx);

        // Update Account Stats
        updateStats(tx.accountId, tx.amount, tx.transactionType, 1);
    }
}

function updateStats(accountId, amount, type, countDelta) {
    let stat = accountStats.get(accountId);
    if (!stat) {
        stat = { totalSpending: 0, transactionCount: 0 };
        accountStats.set(accountId, stat);
    }

    stat.transactionCount += countDelta;

    // Track spending (DEBITs increase spending, CREDITs are ignored for 'spending' metric but kept in tx count)
    if (type === 'DEBIT') {
        // Delta can be negative during cleanup
        stat.totalSpending += (countDelta * amount);
        // Prevent floating point errors
        stat.totalSpending = Math.max(0, stat.totalSpending);
    }

    // If account has no active transactions in the window, remove it to save memory
    if (stat.transactionCount <= 0) {
        accountStats.delete(accountId);
    }
}

function cleanupWindow() {
    const now = Date.now();
    let expiredCount = 0;

    // Because transactions are pushed sequentially, the array is inherently sorted by timestamp.
    // We just read from the beginning to find records older than WINDOW_DURATION_MS
    while (transactionWindow.length > 0 && transactionWindow[0].isOlderThan(WINDOW_DURATION_MS, now)) {
        const expiredTx = transactionWindow.shift(); // Remove from start

        // Reverse the stats
        updateStats(expiredTx.accountId, expiredTx.amount, expiredTx.transactionType, -1);

        expiredCount++;
    }
}

function reportStats() {
    if (!txPort) return;

    let aggregateSpending = 0;

    // Compute total system spending in the window to give an aggregate overview
    for (const stat of accountStats.values()) {
        aggregateSpending += stat.totalSpending;
    }

    // Pass snapshot to Reporter
    txPort.postMessage({
        type: 'STATS_SNAPSHOT',
        data: {
            totalProcessed: totalProcessedThisSession,
            windowTransactionCount: transactionWindow.length,
            activeAccounts: accountStats.size,
            totalRollingSpending: parseFloat(aggregateSpending.toFixed(2)),
            topSpendersCount: Math.min(accountStats.size, 5) // Ex of extended stats we *could* process, but limit generic console noise
        }
    });
}
