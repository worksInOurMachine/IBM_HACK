const { parentPort } = require('worker_threads');

let rxPort = null;
let logCounter = 0;

parentPort.on('message', (message) => {
    if (message.type === 'START') {
        rxPort = message.rxPort;
        setupReporting();
    }
});

function setupReporting() {
    console.log('[Reporting Worker] Started. Waiting for stats...');

    // Use a format string approach for cleaner console output
    rxPort.on('message', (msg) => {
        if (msg.type === 'STATS_SNAPSHOT' && msg.data) {
            logCounter++;
            printReport(msg.data);
        }
    });
}

function printReport(stats) {
    const {
        totalProcessed,
        windowTransactionCount,
        activeAccounts,
        totalRollingSpending
    } = stats;

    // Clear console or just print separators to make it readable.
    // For a streaming server log, simple delimited output is best.

    // Formatting currency and numbers
    const formatCurrent = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalRollingSpending);
    const formatNumber = new Intl.NumberFormat('en-IN').format;

    console.log('\n======================================================');
    console.log(`⏱️  REPORT TCK-${logCounter} | Current Live Status`);
    console.log('------------------------------------------------------');
    console.log(`📈 Total Processed (Session):   ${formatNumber(totalProcessed)}`);
    console.log(`📉 Active Tx in 10-Min Window:  ${formatNumber(windowTransactionCount)}`);
    console.log(`👥 Active Accounts in Window:   ${formatNumber(activeAccounts)}`);
    console.log(`💸 Total Spending in Window:    ${formatCurrent}`);
    console.log('======================================================');
}
