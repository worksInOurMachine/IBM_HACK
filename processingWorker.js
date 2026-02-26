const { parentPort } = require('worker_threads');
const Transaction = require('./transaction');

let rxPort = null;
let txPort = null;

const WINDOW_DURATION_MS = 10 * 60 * 1000;

const transactionWindow = [];

const accountStats = new Map();

let totalProcessedThisSession = 0;

parentPort.on('message', (message) => {
    if (message.type === 'START') {
        rxPort = message.rxPort;
        txPort = message.txPort;

        setupPipeline();
    }
});

function setupPipeline() {
    console.log('[Processing Worker] Started. Managing 10-minute rolling window.');

    rxPort.on('message', (msg) => {
        if (msg.type === 'TX_BATCH' && msg.data) {
            processBatch(msg.data);
        }
    });

    setInterval(cleanupWindow, 1000);

    setInterval(reportStats, 2000);
}

function processBatch(batch) {
    totalProcessedThisSession += batch.length;
    const now = Date.now();

    for (let i = 0; i < batch.length; i++) {
        const rawTx = batch[i];

        const tx = Object.setPrototypeOf(rawTx, Transaction.prototype);

        transactionWindow.push(tx);

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

    if (type === 'DEBIT') {
        stat.totalSpending += (countDelta * amount);
        stat.totalSpending = Math.max(0, stat.totalSpending);
    }

    if (stat.transactionCount <= 0) {
        accountStats.delete(accountId);
    }
}

function cleanupWindow() {
    const now = Date.now();
    let expiredCount = 0;

    while (transactionWindow.length > 0 && transactionWindow[0].isOlderThan(WINDOW_DURATION_MS, now)) {
        const expiredTx = transactionWindow.shift();

        updateStats(expiredTx.accountId, expiredTx.amount, expiredTx.transactionType, -1);

        expiredCount++;
    }
}

function reportStats() {
    if (!txPort) return;

    let aggregateSpending = 0;

    for (const stat of accountStats.values()) {
        aggregateSpending += stat.totalSpending;
    }

    txPort.postMessage({
        type: 'STATS_SNAPSHOT',
        data: {
            totalProcessed: totalProcessedThisSession,
            windowTransactionCount: transactionWindow.length,
            activeAccounts: accountStats.size,
            totalRollingSpending: parseFloat(aggregateSpending.toFixed(2)),
            topSpendersCount: Math.min(accountStats.size, 5)
        }
    });
}
