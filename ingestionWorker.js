const { parentPort } = require('worker_threads');
const { generateMockTransactionData } = require('./utils');
const Transaction = require('./transaction');

let txPort = null;
let txPerSecond = 2000;
let accountPoolSize = 10000;
let simulationInterval = null;

// Event listener for the initial configuration message from parent
parentPort.on('message', (message) => {
    if (message.type === 'START') {
        txPort = message.port;
        txPerSecond = message.txPerSecond || 2000;
        accountPoolSize = message.accountPoolSize || 10000;

        startIngestion();
    }
});

function startIngestion() {
    console.log(`[Ingestion Worker] Started. Targeting ${txPerSecond} TPS...`);

    // To achieve high throughput (e.g. 5000/sec), running setInterval every 1ms is unreliable in Node.
    // Instead, we bundle transactions in blocks every 50ms.
    const intervalMs = 50;
    const txPerInterval = Math.ceil(txPerSecond / (1000 / intervalMs));

    simulationInterval = setInterval(() => {
        if (!txPort) return;

        // Accumulate a batch to reduce MessageChannel overhead
        const batch = [];
        for (let i = 0; i < txPerInterval; i++) {
            const rawData = generateMockTransactionData(accountPoolSize);
            // Instantiate the ES6 Class
            const tx = new Transaction(rawData);
            batch.push(tx);
        }

        // Send the batch to the processing worker
        txPort.postMessage({ type: 'TX_BATCH', data: batch });

    }, intervalMs);
}

// Clean up if the worker is somehow asked to stop
parentPort.on('close', () => {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    if (txPort) {
        txPort.close();
    }
});
