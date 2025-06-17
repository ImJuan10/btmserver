const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Separate holdings for simulation and real modes
let simulationHoldings = {
    BTC: 0.1,
    ETH: 0.5,
    DOGE: 1000,
    SHIB: 500000,
    TON: 50,
    TRX: 1000,
    LTC: 5,
    LUNA: 500,
    BC: 100000, // BC is primarily simulation-based
    USDT: 1000,
};

let realHoldings = {
    BTC: 0.05,
    ETH: 0.2,
    DOGE: 500,
    SHIB: 200000,
    TON: 20,
    TRX: 400,
    LTC: 2,
    LUNA: 200,
    BC: 0, // In real mode, BC holdings start at 0 or very low
    USDT: 500,
};

// Separate price sets for simulation and "real" mode
let simulationPrices = {
    BTC: 0.00089,
    ETH: 0.32,
    DOGE: 0.0000869,
    SHIB: 0.000007,
    TON: 0.39,
    TRX: 0.08,
    LTC: 1.1,
    LUNA: 1.35,
    BC: 0.0001,
    USDT: 1,
};

// Real prices will be fetched from Binance API
let realPrices = {
    BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, TON: 0,
    TRX: 0, LTC: 0, LUNA: 0, BC: 0.0001, USDT: 1, // Initialize with 0, BC from simulation
};

// Simulated exchange rates from USDT to other fiat currencies
let exchangeRates = {
    USDT: 1, // USDT to USDT is 1
    USD: 0.9995, // Example: 1 USDT = 0.9995 USD (can fluctuate)
    EUR: 0.92,   // Example: 1 USDT = 0.92 EUR (can fluctuate)
    SOL: 3.75    // New: 1 USDT = 3.75 Peruvian Sol (initial value)
};

// Separate transactions arrays for simulation and real modes
const simulationTransactions = [];
const realTransactions = [];

// Utility to get current date and time in desired format
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB'); // Format DD/MM/YYYY
    const time = now.toLocaleTimeString('en-GB'); // Format HH:MM:SS
    return `${date} ${time}`;
}

// Add transaction to the respective transaction table
function addTransaction(mode, { orderDate, type, pair, price, amount, total }) {
    const transactionRecord = {
        orderDate,
        type,
        pair,
        price,
        amount,
        total,
    };
    if (mode === 'real') {
        realTransactions.push(transactionRecord);
    } else {
        simulationTransactions.push(transactionRecord);
    }
}

// Store historical price data for both modes
const simulationHistoricalPrices = {
    BTC: [], ETH: [], DOGE: [], SHIB: [], TON: [],
    TRX: [], LTC: [], LUNA: [], BC: [], USDT: [],
};

const realHistoricalPrices = {
    BTC: [], ETH: [], DOGE: [], SHIB: [], TON: [],
    TRX: [], LTC: [], LUNA: [], BC: [], USDT: [],
};

// Simulate price changes for crypto assets (only for simulation mode now)
function simulatePriceChange(currentPrice, currency) {
    let trendDirection = Math.random() < 0.55 ? 1 : -1;
    let trendLength = Math.floor(Math.random() * 10) + 5;

    const stateKey = `${currency}-sim`; // Always for simulation
    if (!simulatePriceChange.trendStates) {
        simulatePriceChange.trendStates = {};
    }
    if (!simulatePriceChange.trendStates[stateKey]) {
        simulatePriceChange.trendStates[stateKey] = {
            remaining: trendLength,
            direction: trendDirection,
        };
    }

    let dynamicProbability = 0.55;
    let fluctuationStrength = Math.random() * 0.001 * (Math.random() < dynamicProbability ? -1 : 1);
    const spikeProbability = 0.005;
    const spikeMagnitude = Math.random() * 0.01 + 0.005;

    let changePercentage;

    if (simulatePriceChange.trendStates[stateKey].remaining > 0) {
        changePercentage = simulatePriceChange.trendStates[stateKey].direction * (Math.random() * 0.02 + 0.01);
        simulatePriceChange.trendStates[stateKey].remaining--;
    } else {
        simulatePriceChange.trendStates[stateKey] = {
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
        return Math.random() * (1.001 - 0.999) + 0.999;
    }

    return Math.max(newPrice, 0.0000000000001);
}

// Simulate price changes for fiat exchange rates
function simulateExchangeRateChange(currentRate) {
    const fluctuation = (Math.random() - 0.5) * 0.005;
    let newRate = currentRate + fluctuation;
    return Math.max(0.001, newRate);
}

// Function to fetch real prices from Binance API
async function fetchPricesFromBinance() {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'DOGEUSDT', 'SHIBUSDT', 'TONUSDT', 'TRXUSDT', 'LTCUSDT', 'LUNAUSDT'];
    const binanceApiBase = 'https://api.binance.com/api/v3/ticker/price?symbol=';

    const fetchedBinancePrices = {};
    for (const symbol of symbols) {
        try {
            const response = await fetch(`${binanceApiBase}${symbol}`);
            if (response.ok) {
                const data = await response.json();
                const baseCurrency = symbol.replace('USDT', '');
                fetchedBinancePrices[baseCurrency] = parseFloat(data.price);
            } else {
                console.warn(`Could not fetch price for ${symbol} from Binance. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error fetching price for ${symbol} from Binance:`, error);
        }
    }

    // Update realPrices with fetched data
    for (const currency in realPrices) {
        if (currency === 'BC') {
            realPrices[currency] = simulationPrices['BC']; // BC always from simulation
        } else if (currency === 'USDT') {
            realPrices[currency] = 1; // USDT remains stable at 1
        } else if (fetchedBinancePrices[currency]) {
            realPrices[currency] = fetchedBinancePrices[currency];
        } else {
            // Fallback to simulation price if Binance data is not available for a coin
            realPrices[currency] = simulationPrices[currency];
            console.warn(`Falling back to simulation price for ${currency} as Binance data is unavailable.`);
        }
    }
}


// Periodically update simulation crypto prices
setInterval(() => {
    for (const currency in simulationPrices) {
        simulationPrices[currency] = simulatePriceChange(simulationPrices[currency], currency);
    }
}, 1000); // Update simulation prices every second

// Periodically update real crypto prices from Binance
// Set a reasonable interval to avoid hitting API rate limits (e.g., every 5 seconds)
setInterval(fetchPricesFromBinance, 1000);

// Periodically update exchange rates
setInterval(() => {
    exchangeRates['USD'] = simulateExchangeRateChange(exchangeRates['USD']);
    exchangeRates['EUR'] = simulateExchangeRateChange(exchangeRates['EUR']);
    exchangeRates['SOL'] = simulateExchangeRateChange(exchangeRates['SOL']);
}, 5000);

// Endpoint to get the current prices based on mode
app.get('/prices', (req, res) => {
    const mode = req.query.mode || 'simulation';
    let pricesToReturn = {};

    if (mode === 'real') {
        pricesToReturn = { ...realPrices };
        pricesToReturn['BC'] = simulationPrices['BC']; // Ensure BC price is always from simulation
    } else {
        pricesToReturn = { ...simulationPrices };
    }
    res.json(pricesToReturn);
});

// Endpoint to get the current exchange rates
app.get('/exchange-rates', (req, res) => {
    res.json(exchangeRates);
});

// Endpoint to get transactions based on mode
app.get('/transactions', (req, res) => {
    const mode = req.query.mode || 'simulation';
    if (mode === 'real') {
        res.json(realTransactions);
    } else {
        res.json(simulationTransactions);
    }
});

// Endpoint to get user holdings based on mode
app.get('/holdings', (req, res) => {
    const mode = req.query.mode || 'simulation';
    if (mode === 'real') {
        res.json(realHoldings);
    } else {
        res.json(simulationHoldings);
    }
});

// Endpoint to handle buy orders
app.post('/buy', (req, res) => {
    const { mode, pair, price, amount, total } = req.body;

    if (!mode || !pair || price <= 0 || amount <= 0 || total <= 0) {
        return res.status(400).json({ message: 'Invalid transaction details.' });
    }

    const [baseCurrency, quoteCurrency] = pair.split('/');

    let targetHoldings = (mode === 'real') ? realHoldings : simulationHoldings;
    let currentPrices = (mode === 'real') ? realPrices : simulationPrices;

    // Special handling for BC coin: its price always comes from simulationPrices for transactions
    if (baseCurrency === 'BC') {
        currentPrices['BC'] = simulationPrices['BC'];
    }

    // Recalculate total based on current prices from the selected mode
    const calculatedTotal = amount * currentPrices[baseCurrency];

    if (targetHoldings[quoteCurrency] < calculatedTotal) {
        return res.status(400).json({ message: `Insufficient ${quoteCurrency} balance in ${mode} mode.` });
    }

    targetHoldings[quoteCurrency] -= calculatedTotal;
    targetHoldings[baseCurrency] = (targetHoldings[baseCurrency] || 0) + amount;

    const newTransaction = {
        orderDate: getCurrentDateTime(),
        type: 'Buy',
        pair,
        price: `${currentPrices[baseCurrency]} USDT`,
        amount: `${amount} ${baseCurrency}`,
        total: `${calculatedTotal} USDT`,
    };

    addTransaction(mode, newTransaction);

    fetch('https://btmserver.onrender.com/notify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
    });

    res.json({
        message: 'Transaction successful!',
        holdings: targetHoldings,
    });
});


// Endpoint to handle sell orders
app.post('/sell', (req, res) => {
    const { mode, pair, price, amount, total } = req.body;

    if (!mode || !pair || price <= 0 || amount <= 0 || total <= 0) {
        return res.status(400).json({ message: 'Invalid transaction details.' });
    }

    const [baseCurrency, quoteCurrency] = pair.split('/');

    let targetHoldings = (mode === 'real') ? realHoldings : simulationHoldings;
    let currentPrices = (mode === 'real') ? realPrices : simulationPrices;

    // Special handling for BC coin: its price always comes from simulationPrices for transactions
    if (baseCurrency === 'BC') {
        currentPrices['BC'] = simulationPrices['BC'];
    }

    // Recalculate total based on current prices from the selected mode
    const calculatedTotal = amount * currentPrices[baseCurrency];

    if (targetHoldings[baseCurrency] < amount) {
        return res.status(400).json({ message: `Insufficient ${baseCurrency} balance in ${mode} mode.` });
    }

    targetHoldings[baseCurrency] -= amount;
    targetHoldings[quoteCurrency] = (targetHoldings[quoteCurrency] || 0) + calculatedTotal;

    const newTransaction = {
        orderDate: getCurrentDateTime(),
        type: 'Sell',
        pair,
        price: `${currentPrices[baseCurrency]} USDT`,
        amount: `${amount} ${baseCurrency}`,
        total: `${calculatedTotal} USDT`,
    };

    addTransaction(mode, newTransaction);

    fetch('https://btmserver.onrender.com/notify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
    });

    res.json({
        message: 'Sell order successful!',
        holdings: targetHoldings,
    });
});

// Update historical prices arrays periodically
function updateHistoricalPriceArrays() {
    // Update simulation historical prices
    for (const currency in simulationPrices) {
        if (!simulationHistoricalPrices[currency]) simulationHistoricalPrices[currency] = [];
        simulationHistoricalPrices[currency].push(simulationPrices[currency]);
        if (simulationHistoricalPrices[currency].length > 8640) simulationHistoricalPrices[currency].shift();
    }

    // Update real historical prices
    for (const currency in realPrices) {
        if (!realHistoricalPrices[currency]) realHistoricalPrices[currency] = [];
        // For real historical prices, ensure BC is always from simulation historical prices
        if (currency === 'BC') {
            realHistoricalPrices[currency].push(simulationPrices[currency]); // Use current simulation price for BC
        } else {
            realHistoricalPrices[currency].push(realPrices[currency]);
        }
        if (realHistoricalPrices[currency].length > 8640) realHistoricalPrices[currency].shift();
    }
}
setInterval(updateHistoricalPriceArrays, 1000);

// Endpoint to retrieve historical price data for a specific pair based on mode
app.get('/prices/:pair', (req, res) => {
    const pair = req.params.pair;
    const [baseCurrency] = pair.split('/');
    const mode = req.query.mode || 'simulation';

    let targetHistoricalPricesSource;
    if (mode === 'real' && baseCurrency !== 'BC') {
        targetHistoricalPricesSource = realHistoricalPrices;
    } else {
        targetHistoricalPricesSource = simulationHistoricalPrices;
    }

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

// Notify clients about new transactions (currently only sends simulation-based notifications)
app.post('/notify-transaction', (req, res) => {
    const newTransaction = req.body;
    transactionEmitter.emit('newTransaction', newTransaction);
    res.status(200).send('Notification sent');
});

// SSE endpoint for clients to subscribe (currently only streams simulation transactions)
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

// Store historical balances for both modes
const simulationHistoricalBalances = [];
const realHistoricalBalances = [];

// Function to calculate the current estimated balance for a given price set and holdings
function calculateEstimatedBalance(currentPrices, holdings) {
    return Object.entries(holdings).reduce((total, [currency, holding]) => {
        const price = currentPrices[currency] || 0;
        return total + holding * price;
    }, 0);
}

// Periodically update historical balances for both simulation and real modes
function updateHistoricalBalances() {
    // For simulation mode
    const simEstimatedBalance = calculateEstimatedBalance(simulationPrices, simulationHoldings);
    simulationHistoricalBalances.push({
        balance: simEstimatedBalance,
        timestamp: Date.now(),
    });
    if (simulationHistoricalBalances.length > 8640) {
        simulationHistoricalBalances.shift();
    }

    // For real mode
    // Create an effective price object for real mode balance calculation, ensuring BC uses simulation price
    let effectiveRealPricesForBalance = { ...realPrices };
    effectiveRealPricesForBalance['BC'] = simulationPrices['BC']; // BC price always from simulation

    const realEstimatedBalance = calculateEstimatedBalance(effectiveRealPricesForBalance, realHoldings);
    realHistoricalBalances.push({
        balance: realEstimatedBalance,
        timestamp: Date.now(),
    });
    if (realHistoricalBalances.length > 8640) {
        realHistoricalBalances.shift();
    }
}

setInterval(updateHistoricalBalances, 1000);

// Endpoint to retrieve historical balance data based on mode
app.get('/balances', (req, res) => {
    const mode = req.query.mode || 'simulation';
    const historicalBalancesToReturn = (mode === 'real') ? realHistoricalBalances : simulationHistoricalBalances;
    res.json(historicalBalancesToReturn);
});

app.get('/', (req, res) => {
    res.send('<h1>Bit The Market</h1><p>Your Node.js app is running!</p>');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
