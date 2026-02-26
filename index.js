const { Worker, MessageChannel } = require('worker_threads');
const path = require('path');

const NUM_ACCOUNTS = 10000;
const TRANSACTIONS_PER_SECOND = 4000;

console.log('Starting Real-Time Financial Transaction Processing Engine...');
console.log(`Simulation Target: ~${TRANSACTIONS_PER_SECOND} tx/sec across ${NUM_ACCOUNTS} accounts.\n`);

const ingestionWorker = new Worker(path.join(__dirname, 'ingestionWorker.js'));
const processingWorker = new Worker(path.join(__dirname, 'processingWorker.js'));
const reportingWorker = new Worker(path.join(__dirname, 'reportingWorker.js'));

const { port1: ingestionTxPort, port2: processingRxPort } = new MessageChannel();
const { port1: processingStatsPort, port2: reportingStatsPort } = new MessageChannel();

ingestionWorker.postMessage({
    type: 'START',
    txPerSecond: TRANSACTIONS_PER_SECOND,
    accountPoolSize: NUM_ACCOUNTS,
    port: ingestionTxPort
}, [ingestionTxPort]);

processingWorker.postMessage({
    type: 'START',
    rxPort: processingRxPort,
    txPort: processingStatsPort
}, [processingRxPort, processingStatsPort]);

reportingWorker.postMessage({
    type: 'START',
    rxPort: reportingStatsPort
}, [reportingStatsPort]);

const handleWorkerExit = (workerName) => (code) => {
    if (code !== 0) {
        console.error(`${workerName} Worker stopped with exit code ${code}`);
    } else {
        console.log(`${workerName} Worker exited successfully.`);
    }
};

const handleWorkerError = (workerName) => (err) => {
    console.error(`Error in ${workerName} Worker:`, err);
};

ingestionWorker.on('error', handleWorkerError('Ingestion'));
ingestionWorker.on('exit', handleWorkerExit('Ingestion'));

processingWorker.on('error', handleWorkerError('Processing'));
processingWorker.on('exit', handleWorkerExit('Processing'));

reportingWorker.on('error', handleWorkerError('Reporting'));
reportingWorker.on('exit', handleWorkerExit('Reporting'));

process.on('SIGINT', () => {
    console.log('\nShutting down transaction engine gracefully...');
    ingestionWorker.terminate();
    processingWorker.terminate();
    reportingWorker.terminate();
    process.exit(0);
});
