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

// Real prices will be initially fetched from CMC for all supported, then updated by fetchPricesFromCMC()
let realPrices = {
    BTC: 0, ETH: 0, DOGE: 0, SHIB: 0, TON: 0,
    TRX: 0, LTC: 0, LUNA: 0, BC: 0, USDT: 1,
};

// Last successful real prices (for fallback) - important for when CMC fetch fails
let lastSuccessfulRealPrices = { ...realPrices };

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

// CMC API Key
const CMC_API_KEY = 'fb3d7be2-38b1-4afd-b436-7ac1c56a8c49'; // Your provided API Key
const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// List of crypto symbols to fetch from CoinMarketCap
const CMC_API_SYMBOLS = ['BTC', 'ETH', 'DOGE', 'SHIB', 'TON', 'TRX', 'LTC', 'LUNA']; // LUNA is typically 'LUNA' or 'LUNC' depending on version. Using 'LUNA' based on your context.

// Function to fetch real prices from CoinMarketCap API for all supported symbols
async function fetchPricesFromCMC() {
    const symbolsToFetch = CMC_API_SYMBOLS.join(','); // Comma-separated list for CMC API
    const vsCurrency = 'USDT';

    try {
        const response = await fetch(`${CMC_API_BASE}?symbol=${symbolsToFetch}&convert=${vsCurrency}`, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            let fetchedCMCData = {};
            for (const symbol of CMC_API_SYMBOLS) {
                if (data.data && data.data[symbol] && data.data[symbol].quote && data.data[symbol].quote[vsCurrency] && data.data[symbol].quote[vsCurrency].price !== undefined) {
                    fetchedCMCData[symbol] = parseFloat(data.data[symbol].quote[vsCurrency].price);
                } else {
                    console.warn(`CMC price for ${symbol} not found in response or undefined.`);
                }
            }

            // Update realPrices with newly fetched data, ensuring fallbacks
            for (const currency in realPrices) {
                if (currency === 'BC') {
                    realPrices[currency] = simulationPrices['BC']; // BC always from simulation
                } else if (currency === 'USDT') {
                    realPrices[currency] = 1; // USDT remains stable at 1
                } else if (fetchedCMCData[currency] !== undefined) {
                    realPrices[currency] = fetchedCMCData[currency]; // Use fetched price
                } else {
                    // Fallback to last successful or simulation price if CMC data is not available for a coin
                    realPrices[currency] = lastSuccessfulRealPrices[currency] || simulationPrices[currency];
                    console.warn(`Keeping last successful real price for ${currency} or falling back to simulation (CMC data unavailable).`);
                }
            }
            lastSuccessfulRealPrices = { ...realPrices }; // Update last successful prices
            console.log('Real prices updated from CMC (or fallback):', realPrices);

        } else {
            console.warn(`Could not fetch prices from CMC. Status: ${response.status} ${response.statusText}. Using last successful prices.`);
            // Fallback: realPrices retain last known values (from lastSuccessfulRealPrices)
            realPrices = { ...lastSuccessfulRealPrices, BC: simulationPrices['BC'] };
        }
    } catch (error) {
        console.error('Error fetching prices from CMC:', error);
        // Fallback: realPrices retain last known values (from lastSuccessfulRealPrices)
        realPrices = { ...lastSuccessfulRealPrices, BC: simulationPrices['BC'] };
        console.warn('Network error during CMC fetch. Using last successful real prices or initial values.');
    }
}

// Function to initialize realPrices by attempting an API call for all supported cryptos or using sensible defaults
async function initializeRealPrices() {
    console.log('Initializing real prices on server startup...');
    const symbolsToFetch = CMC_API_SYMBOLS.join(',');
    const vsCurrency = 'USDT';

    try {
        const response = await fetch(`${CMC_API_BASE}?symbol=${symbolsToFetch}&convert=${vsCurrency}`, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            for (const symbol of CMC_API_SYMBOLS) {
                if (data.data && data.data[symbol] && data.data[symbol].quote && data.data[symbol].quote[vsCurrency] && data.data[symbol].quote[vsCurrency].price !== undefined) {
                    realPrices[symbol] = parseFloat(data.data[symbol].quote[vsCurrency].price);
                } else {
                    console.warn(`Initial CMC price for ${symbol} not found in response. Using hardcoded default.`);
                    // Hardcoded fallback if CMC data is missing for a specific coin
                    realPrices[symbol] = {
                        BTC: 69500, ETH: 3800, DOGE: 0.16, SHIB: 0.000028, TON: 7.2,
                        TRX: 0.11, LTC: 75, LUNA: 0.00013,
                    }[symbol] || 0;
                }
            }
        } else {
            console.warn(`Could not fetch initial prices from CMC. Status: ${response.status}. Using hardcoded defaults for all.`);
            // Fallback for all if initial API call fails
            realPrices.BTC = 69500; realPrices.ETH = 3800; realPrices.DOGE = 0.16;
            realPrices.SHIB = 0.000028; realPrices.TON = 7.2; realPrices.TRX = 0.11;
            realPrices.LTC = 75; realPrices.LUNA = 0.00013;
        }
    } catch (error) {
        console.error('Error during initial CMC fetch:', error);
        console.warn('Network error during initial CMC fetch. Using hardcoded defaults for real prices.');
        realPrices.BTC = 69500; realPrices.ETH = 3800; realPrices.DOGE = 0.16;
        realPrices.SHIB = 0.000028; realPrices.TON = 7.2; realPrices.TRX = 0.11;
        realPrices.LTC = 75; realPrices.LUNA = 0.00013;
    }

    realPrices.BC = simulationPrices['BC']; // BC price always from simulation
    realPrices.USDT = 1; // USDT always 1

    lastSuccessfulRealPrices = { ...realPrices }; // Set initial last successful prices
    console.log('Real prices initialized:', realPrices);
}


// Periodically update simulation crypto prices
setInterval(() => {
    for (const currency in simulationPrices) {
        simulationPrices[currency] = simulatePriceChange(simulationPrices[currency], currency); // Use the provided simulation logic
    }
}, 1000);

// Periodically update real crypto prices from CoinMarketCap (for supported symbols)
setInterval(fetchPricesFromCMC, 15000); // Attempt to fetch from CMC every 15 seconds


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
    // Initialize real prices once when the server starts with CMC fetch
    initializeRealPrices();
});
