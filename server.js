const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Initial holdings for assets - remains shared as holdings are independent of price source
let userHoldings = {
    BTC: 0,
    ETH: 0,
    DOGE: 0,
    SHIB: 0,
    TON: 0,
    TRX: 0,
    LTC: 0,
    LUNA: 0,
    BC: 0,
    USDT: 10, // USDT remains the base quote currency for crypto prices
};

// Only maintain simulation prices as there's no mode selection
let prices = {
    BTC: 0.00089,
    ETH: 0.32,
    DOGE: 0.0000869,
    SHIB: 0.000007,
    TON: 0.39,
    TRX: 0.08,
    LTC: 1.1,
    LUNA: 1.35,
    BC: 0.0001,
    USDT: 1, // USDT is considered 1:1 for simplicity against itself
};

// Simulated exchange rates from USDT to other fiat currencies
let exchangeRates = {
    USDT: 1, // USDT to USDT is 1
    USD: 0.9995, // Example: 1 USDT = 0.9995 USD (can fluctuate)
    EUR: 0.92,   // Example: 1 USDT = 0.92 EUR (can fluctuate)
};

// Transactions array to store all transactions - always tied to the simulation logic
const transactions = [];

// Utility to get current date and time in desired format
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB'); // Format DD/MM/YYYY
    const time = now.toLocaleTimeString('en-GB'); // Format HH:MM:SS
    return `${date} ${time}`;
}

// Add transaction to the table
function addTransaction({ orderDate, type, pair, price, amount, total }) {
    transactions.push({
        orderDate,
        type,
        pair,
        price,
        amount,
        total,
    });
}

// Store historical price data - only for simulation now
const historicalPrices = {
    BTC: [], ETH: [], DOGE: [], SHIB: [], TON: [],
    TRX: [], LTC: [], LUNA: [], BC: [], USDT: [],
};

// Simulate price changes for crypto assets
function simulatePriceChange(currentPrice, currency) {
    let trendDirection = Math.random() < 0.55 ? 1 : -1;
    let trendLength = Math.floor(Math.random() * 10) + 5;

    if (!simulatePriceChange.trendStates) {
        simulatePriceChange.trendStates = {};
    }
    if (!simulatePriceChange.trendStates[currency]) {
        simulatePriceChange.trendStates[currency] = {
            remaining: trendLength,
            direction: trendDirection,
        };
    }

    let dynamicProbability = 0.55;
    let fluctuationStrength = Math.random() * 0.001 * (Math.random() < dynamicProbability ? -1 : 1);
    const spikeProbability = 0.005;
    const spikeMagnitude = Math.random() * 0.01 + 0.005;

    let changePercentage;

    if (simulatePriceChange.trendStates[currency].remaining > 0) {
        changePercentage = simulatePriceChange.trendStates[currency].direction * (Math.random() * 0.02 + 0.01);
        simulatePriceChange.trendStates[currency].remaining--;
    } else {
        simulatePriceChange.trendStates[currency] = {
            remaining: Math.floor(Math.random() * 10) + 5,
            direction: Math.random() < dynamicProbability ? 1 : -1,
        };
        changePercentage = fluctuationStrength;
    }

    if (Math.random() < spikeProbability) {
        changePercentage += spikeMagnitude * (Math.random() < dynamicProbability ? -1 : 1);
    }

    let newPrice = currentPrice * (1 + changePercentage);

    const slowIncreaseMultiplier = 0.999;

    if (newPrice >= 3857 && currency === 'ETH') newPrice *= slowIncreaseMultiplier;
    if (newPrice >= 5.75 && currency === 'DOGE') newPrice *= slowIncreaseMultiplier;
    if (newPrice >= 0.075 && currency === 'SHIB') newPrice *= slowIncreaseMultiplier;
    if (newPrice >= 15.12 && currency === 'TON') newPrice *= slowIncreaseMultiplier;
    if (newPrice >= 315.12 && (currency === 'TRX' || currency === 'LTC' || currency === 'LUNA')) newPrice *= slowIncreaseMultiplier;
    if (newPrice >= 100000 && (currency === 'BTC' || currency === 'BC')) newPrice *= slowIncreaseMultiplier;

    if (currency === 'USDT') {
        return Math.random() * (1.001 - 0.999) + 0.999; // Tiny fluctuation around 1.00
    }

    return Math.max(newPrice, 0.0000000000001); // Ensure no negative or near-zero prices
}

// Simulate price changes for fiat exchange rates
function simulateExchangeRateChange(currentRate) {
    const fluctuation = (Math.random() - 0.5) * 0.005; // +/- 0.5% fluctuation
    let newRate = currentRate + fluctuation;
    return Math.max(0.001, newRate); // Ensure rate doesn't go to zero or negative
}

// Periodically update crypto prices
function updatePrices() {
    for (const currency in prices) {
        prices[currency] = simulatePriceChange(prices[currency], currency);
    }
}
setInterval(updatePrices, 1000); // Update crypto prices every second

// Periodically update exchange rates
function updateExchangeRates() {
    // Only USD and EUR rates will fluctuate relative to USDT (which is base 1)
    exchangeRates['USD'] = simulateExchangeRateChange(exchangeRates['USD']);
    exchangeRates['EUR'] = simulateExchangeRateChange(exchangeRates['EUR']);
}
setInterval(updateExchangeRates, 5000); // Update exchange rates every 5 seconds

// Endpoint to get the current prices
app.get('/prices', (req, res) => {
    res.json(prices);
});

// Endpoint to get the current exchange rates
app.get('/exchange-rates', (req, res) => {
    res.json(exchangeRates);
});

// Endpoint to get transactions
app.get('/transactions', (req, res) => {
    res.json(transactions);
});

// Endpoint to get user holdings
app.get('/holdings', (req, res) => {
    res.json(userHoldings);
});

// Endpoint to handle buy orders
app.post('/buy', (req, res) => {
    const { pair, price, amount, total } = req.body;

    if (!pair || price <= 0 || amount <= 0 || total <= 0) {
        return res.status(400).json({ message: 'Invalid transaction details.' });
    }

    const [baseCurrency, quoteCurrency] = pair.split('/');

    if (userHoldings[quoteCurrency] < total) {
        return res.status(400).json({ message: `Insufficient ${quoteCurrency} balance.` });
    }

    userHoldings[quoteCurrency] -= total;
    userHoldings[baseCurrency] = (userHoldings[baseCurrency] || 0) + amount;

    const newTransaction = {
        orderDate: getCurrentDateTime(),
        type: 'Buy',
        pair,
        price: `${price} USDT`,
        amount: `${amount} ${baseCurrency}`,
        total: `${total} USDT`,
    };

    addTransaction(newTransaction);

    // Notify clients about the new transaction
    fetch('https://btmserver.onrender.com/notify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
    });

    res.json({
        message: 'Transaction successful!',
        holdings: userHoldings,
    });
});


// Endpoint to handle sell orders
app.post('/sell', (req, res) => {
    const { pair, price, amount, total } = req.body;

    if (!pair || price <= 0 || amount <= 0 || total <= 0) {
        return res.status(400).json({ message: 'Invalid transaction details.' });
    }

    const [baseCurrency, quoteCurrency] = pair.split('/');

    if (userHoldings[baseCurrency] < amount) {
        return res.status(400).json({ message: `Insufficient ${baseCurrency} balance.` });
    }

    userHoldings[baseCurrency] -= amount;
    userHoldings[quoteCurrency] = (userHoldings[quoteCurrency] || 0) + total;

    const newTransaction = {
        orderDate: getCurrentDateTime(),
        type: 'Sell',
        pair,
        price: `${price} USDT`,
        amount: `${amount} ${baseCurrency}`,
        total: `${total} USDT`,
    };

    addTransaction(newTransaction);

    // Notify clients about the new transaction
    fetch('https://btmserver.onrender.com/notify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
    });

    res.json({
        message: 'Sell order successful!',
        holdings: userHoldings,
    });
});

// Update historical prices array periodically
function updateHistoricalPriceArrays() {
    for (const currency in prices) {
        if (!historicalPrices[currency]) historicalPrices[currency] = [];
        historicalPrices[currency].push(prices[currency]);
        if (historicalPrices[currency].length > 8640) historicalPrices[currency].shift();
    }
}
setInterval(updateHistoricalPriceArrays, 1000); // Update historical arrays every second

// Endpoint to retrieve historical price data for a specific pair
app.get('/prices/:pair', (req, res) => {
    const pair = req.params.pair;
    const [baseCurrency] = pair.split('/');

    let targetHistoricalPricesSource = historicalPrices;

    if (targetHistoricalPricesSource[baseCurrency]) {
        res.json(targetHistoricalPricesSource[baseCurrency].map((price, index) => ({
            price,
            timestamp: Date.now() - ((targetHistoricalPricesSource[baseCurrency].length - 1 - index) * 1000),
        })));
    } else {
        res.status(404).send('Pair not found');
    }
});


const events = require('events');
const transactionEmitter = new events.EventEmitter();

// Notify clients about new transactions
app.post('/notify-transaction', (req, res) => {
    const newTransaction = req.body;
    transactionEmitter.emit('newTransaction', newTransaction);
    res.status(200).send('Notification sent');
});

// SSE endpoint for clients to subscribe
app.get('/transactions/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onNewTransaction = (transaction) => {
        res.write(`data: ${JSON.stringify(transaction)}\n\n`);
    };

    transactionEmitter.on('newTransaction', onNewTransaction);

    req.on('close', () => {
        transactionEmitter.removeListener('newTransaction', onNewTransaction);
    });
});

// Store historical balances
const historicalBalances = [];

// Function to calculate the current estimated balance
function calculateEstimatedBalance(currentPrices, holdings) {
    return Object.entries(holdings).reduce((total, [currency, holding]) => {
        const price = currentPrices[currency] || 0;
        return total + holding * price;
    }, 0);
}

// Periodically update historical balances
function updateHistoricalBalances() {
    const estimatedBalance = calculateEstimatedBalance(prices, userHoldings);
    historicalBalances.push({
        balance: estimatedBalance,
        timestamp: Date.now(),
    });
    if (historicalBalances.length > 8640) {
        historicalBalances.shift();
    }
}

setInterval(updateHistoricalBalances, 1000); // Update every second

// Endpoint to retrieve historical balance data
app.get('/balances', (req, res) => {
    res.json(historicalBalances);
});

app.get('/', (req, res) => {
    res.send('<h1>Bit The Market</h1><p>Your Node.js app is running!</p>');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
