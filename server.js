const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Separate holdings for simulation and real modes
let simulationHoldings = {
    BTC: 0,
    ETH: 0,
    DOGE: 0,
    SHIB: 0,
    TON: 0,
    TRX: 0,
    LTC: 0,
    LUNA: 0,
    BC: 0, // BC is primarily simulation-based
    USDT: 10,
};

let realHoldings = {
    BTC: 0,
    ETH: 0,
    DOGE: 0,
    SHIB: 0,
    TON: 0,
    TRX: 0,
    LTC: 0,
    LUNA: 0,
    BC: 0, // In real mode, BC holdings start at 0 or very low
    USDT: 10,
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

// Initialize real prices to 0, they will be populated by initializeRealPrices() before server starts
let realPrices = {
    BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, TON: 0,
    TRX: 0, LTC: 0, LUNA: 0, BC: 0, USDT: 1,
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

// Simulate price changes for crypto assets (ONLY for simulation mode)
function simulatePriceChange(currentPrice, currency) {
    // Configuration for trends
    let trendDirection = Math.random() < 0.55 ? 1 : -1; // 1 for upward, -1 for downward
    let trendLength = Math.floor(Math.random() * 10) + 5; // 5 to 15 iterations
    let trendStrength = Math.random() * 0.02 + 0.01; // 1% to 3% per step

    // Track start time if not already set (specific to this simulation logic)
    if (!simulatePriceChange.startTime) {
        simulatePriceChange.startTime = Date.now(); // Record the program's start time in milliseconds
    }

    // Calculate elapsed time in seconds (specific to this simulation logic)
    const elapsedTime = (Date.now() - simulatePriceChange.startTime) / 10;

    // Function to calculate dynamic probability that toggles every minute (specific to this simulation logic)
    function getDynamicProbability(elapsed) {
        const minutes = Math.floor(elapsed / 60); // Get elapsed time in whole minutes
        return minutes % 2 === 0 ? 0.58 : 0.45; // Alternate between 0.7 and 0.5 every minute
    }

    // Calculate dynamic probability based on elapsed time (specific to this simulation logic)
    let dynamicProbability = getDynamicProbability(elapsedTime);

    // Debug the calculated probability and elapsed time
    // console.debug(`Dynamic Probability after ${elapsedTime.toFixed(1)} seconds is ${dynamicProbability}`);

    // Minor fluctuations outside of trends
    let fluctuationStrength = Math.random() * 0.005 * (Math.random() < dynamicProbability ? -1 : 1);

    // Spike/Dip Probability
    const spikeProbability = 0.005;
    const spikeMagnitude = Math.random() * 0.1 + 0.05; // 5% to 15%

    // Track trend state (specific to this simulation logic)
    // Use a unique key for each currency's trendState to avoid conflicts
    if (!simulatePriceChange.trendStatePerCurrency) {
        simulatePriceChange.trendStatePerCurrency = {};
    }
    if (!simulatePriceChange.trendStatePerCurrency[currency]) {
        simulatePriceChange.trendStatePerCurrency[currency] = {
            remaining: trendLength,
            direction: trendDirection,
        };
    }

    let changePercentage;

    // Apply trend if active
    if (simulatePriceChange.trendStatePerCurrency[currency].remaining > 0) {
        changePercentage = simulatePriceChange.trendStatePerCurrency[currency].direction * trendStrength;
        simulatePriceChange.trendStatePerCurrency[currency].remaining--;
    } else {
        // Reset trend when it ends
        simulatePriceChange.trendStatePerCurrency[currency] = {
            remaining: Math.floor(Math.random() * 10) + 5, // New trend length
            direction: Math.random() < dynamicProbability ? 1 : -1, // Random direction
        };
        changePercentage = fluctuationStrength;
    }

    // Apply spike/dip randomly
    if (Math.random() < spikeProbability) {
        changePercentage += spikeMagnitude * (Math.random() < dynamicProbability ? -1 : 1);
    }

    // Calculate new price
    let newPrice = currentPrice * (1 + changePercentage);

    // Define multipliers
    // const fastIncreaseMultiplier = 1.01; // Not used in provided snippet
    const slowIncreaseMultiplier = 0.999; // Slow down price growth

    // Apply multipliers based on price range
    if (newPrice >= 3857) {
        if (currency === 'ETH') {
            newPrice *= slowIncreaseMultiplier;
        }
    } 

    if (newPrice >= 5.75) {
        if (currency === 'DOGE') {
            newPrice *= slowIncreaseMultiplier;
        }
    }
    
    if (newPrice >= 0.075) {
        if (currency === 'SHIB') {
            newPrice *= slowIncreaseMultiplier;
        }
    }

    if (newPrice >= 15.12) {
        if (currency === 'TON') {
            newPrice *= slowIncreaseMultiplier;
        }
    }

    if (newPrice >= 315.12) {
        if (currency === 'TRX' || currency === 'LTC' || currency === 'LUNA') {
            newPrice *= slowIncreaseMultiplier;
        }
    }

    if (newPrice >= 100000) {
        if (currency === 'BTC' || currency === 'BC') {
            newPrice *= slowIncreaseMultiplier;
        }
    }

    // Ensure stability for USDT or similar stablecoins
    if (currency === 'USDT') {
        return Math.random() * (1.001 - 0.999) + 0.999; // Tiny fluctuation around 1.00
    }

    return Math.max(newPrice, 0.0000000000001); // Ensure no negative or near-zero prices
}


// Simulate price changes for fiat exchange rates
function simulateExchangeRateChange(currentRate) {
    const fluctuation = (Math.random() - 0.5) * 0.005;
    let newRate = currentRate + fluctuation;
    return Math.max(0.001, newRate);
}

// Function to initialize realPrices (mimics fetching from an API)
// This will set the initial realPrices array when the server starts
async function initializeRealPrices() {
    console.log('Initializing real prices...');
    // Simulate fetching initial real-world like prices
    // In a real application, this would be an actual API call to Binance or similar.
    realPrices = {
        BTC: 69500 + (Math.random() * 2000 - 1000), // Around 69.5k +/- 1k
        ETH: 3800 + (Math.random() * 200 - 100),   // Around 3.8k +/- 100
        DOGE: 0.16 + (Math.random() * 0.01 - 0.005),// Around 0.16 +/- 0.005
        SHIB: 0.000028 + (Math.random() * 0.000001 - 0.0000005), // Around 0.000028 +/- small amount
        TON: 7.2 + (Math.random() * 0.5 - 0.25),   // Around 7.2 +/- 0.25
        TRX: 0.11 + (Math.random() * 0.005 - 0.0025),// Around 0.11 +/- 0.0025
        LTC: 75 + (Math.random() * 3 - 1.5),      // Around 75 +/- 1.5
        LUNA: 0.00013 + (Math.random() * 0.000005 - 0.0000025), // Around 0.00013 +/- small amount
        BC: simulationPrices['BC'], // BC price always from simulation
        USDT: 1, // USDT remains stable
    };
    console.log('Real prices initialized:', realPrices);
}


// Periodically update simulation crypto prices
setInterval(() => {
    for (const currency in simulationPrices) {
        simulationPrices[currency] = simulatePriceChange(simulationPrices[currency], currency); // Use the provided simulation logic
    }
}, 1000);

// Periodically update "real" crypto prices with a very subtle organic change
// This simulates prices continuing from their last known value, rather than restarting trends.
setInterval(() => {
    for (const currency in realPrices) {
        if (currency === 'BC') {
            realPrices[currency] = simulationPrices['BC']; // BC price remains tied to simulation
        } else if (currency === 'USDT') {
            realPrices[currency] = 1; // USDT remains stable at 1
        } else {
            const smallFluctuation = (Math.random() - 0.5) * 0.0005 * realPrices[currency]; // +/- 0.05%
            realPrices[currency] += smallFluctuation;
            realPrices[currency] = Math.max(realPrices[currency], 0.0000000000001); // Ensure no negative prices
        }
    }
}, 2000); // Update "real" prices at a different interval (e.g., slower)


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
