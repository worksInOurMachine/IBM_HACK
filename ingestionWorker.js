const { parentPort } = require('worker_threads');
const { generateMockTransactionData } = require('./utils');
const Transaction = require('./transaction');

let txPort = null;
let txPerSecond = 2000;
let accountPoolSize = 10000;
let simulationInterval = null;

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

    const intervalMs = 50;
    const txPerInterval = Math.ceil(txPerSecond / (1000 / intervalMs));

    simulationInterval = setInterval(() => {
        if (!txPort) return;

        const batch = [];
        for (let i = 0; i < txPerInterval; i++) {
            const rawData = generateMockTransactionData(accountPoolSize);
            const tx = new Transaction(rawData);
            batch.push(tx);
        }

        txPort.postMessage({ type: 'TX_BATCH', data: batch });

    }, intervalMs);
}

parentPort.on('close', () => {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    if (txPort) {
        txPort.close();
    }
});
