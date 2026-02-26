# Real-Time Financial Transaction Processing Engine

## 🚀 Overview
Welcome to the Real-Time Financial Transaction Processing Engine! This project simulates the high-speed core of a digital bank. It handles large volumes of transactions (like card payments, ATM withdrawals, and transfers) in real-time, completely from scratch using **pure Node.js**—no Express, no external frameworks, and no databases.

Our engine is capable of processing thousands of transactions per second across thousands of distinct accounts, all while maintaining a rolling "10-minute window" to monitor live activity and spending without crashing or freezing.

## 🧠 Why we did it this way (The Hackathon Challenge)
Modern banking systems face a heavy burden: millions of transactions flood in, and the system must approve, process, and track them instantaneously without delays or memory leaks.

Node.js is traditionally single-threaded, meaning that a massive loop of heavy math could crash or slow down the whole application. To solve this efficiently and prove true backend engineering concepts, we bypassed the single-threaded limitation by building a **Multi-Threaded Architecture** using Node.js `worker_threads` and `MessageChannel`.

## ⚙️ Architecture & Workflow

Here is exactly how the system processes data live, explained simply:

### 1. The Main Thread (`index.js`) -> *The Conductor*
The main file starts the engine. Instead of doing the heavy lifting itself, it hires three "workers" (separate background threads) and gives them direct, private communication channels. This prevents the primary engine from ever freezing.

### 2. Ingestion Worker (`ingestionWorker.js`) -> *The Firehose*
This worker's only job is to generate massive amounts of live transaction data (simulating rapid card swipes and transfers globally).
- It creates batches of realistic transaction data using our `utils.js` (including UUIDs, amounts, locations).
- It bundles these transactions into a standardized ES6 `Transaction` class (`transaction.js`).
- It shoots them directly to the Processing Worker as fast as possible.

### 3. Processing Worker (`processingWorker.js`) -> *The Calculating Brain*
This represents the hardest working part of the engine. It has two main tasks that are heavily optimized to save CPU and RAM.
- **Handling Inflow:** When batches arrive, it pushes them into an array acting as a timeline (`transactionWindow`). It uses a fast JavaScript `Map` structure to instantly update how much money each account is spending right now.
- **Aggressive Memory Cleanup:** It runs a constant background loop checking the start of our timeline. The very moment a transaction becomes older than **10 minutes**, it automatically throws the old transaction out of memory and subtracts it from the running "spending" total, ensuring the server doesn't bloat and crash.

### 4. Reporting Worker (`reportingWorker.js`) -> *The Dashboard*
We don't want our calculating brain to waste precious time formatting texts and printing to screens. So, every few seconds, the Processing Worker sends a tiny snapshot summary of the live "system pulse" to the Reporting Worker, which neatly prints human-readable statistics to the console.

## 💻 Tech Stack Constraints
In our code and hackathon criteria, we proved you don't need massive web servers or external dependencies to achieve raw backend performance:
- Only core standard modules utilized (`fs`, `worker_threads`, `crypto`, `path`, `events`).
- **No** `Express.js`, `No` Databases.
- Event-driven streams and explicit garbage-handling logic.
- Pure JavaScript (CommonJS) utilizing proper ES6 Object-Oriented Programming (OOP) principles.

## 🏃 Getting Started
Run the engine from your terminal:
```bash
node index.js
```
Sit back and watch the multi-threaded backend crunch through thousands of transactions!
