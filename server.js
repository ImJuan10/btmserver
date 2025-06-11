const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({
  origin: 'https://eclectic-kashata-7af9d3.netlify.app', // Allow only your domain
}));

// Initial holdings for assets
let userHoldings = {
    BTC: 1000000,
    ETH: 0,
    DOGE: 0,
    SHIB: 0,
    TON: 0,
    TRX: 0,
    LTC: 0,
    LUNA: 0,
    BC: 0,
    USDT: 100,
};

// Initial prices for assets
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
    USDT: 1,
};

// Transactions array to store all transactions
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
        from: '-',
        to: '-',
        rate: '-',
    });
}

// Calculate 24H Min and Max for each asset
function calculate24HMinMax() {
    const minMaxData = {};

    for (const [currency, priceHistory] of Object.entries(historicalPrices)) {
        if (priceHistory.length >= 24) {
            const last24Hours = priceHistory.slice(-24); // Get the last 24 hours of data
            const minPrice = Math.min(...last24Hours);
            const maxPrice = Math.max(...last24Hours);

            minMaxData[currency] = {
                min: minPrice,
                max: maxPrice,
            };
        }
    }

    return minMaxData;
}

// Endpoint to get 24H Min and Max
app.get('/price-24h-min-max', (req, res) => {
    const minMaxData = calculate24HMinMax();
    res.json(minMaxData);
});


// Simulate price changes
function simulatePriceChange(currentPrice, currency) {
    // Configuration for trends
    let trendDirection = Math.random() < 0.55 ? 1 : -1; // 1 for upward, -1 for downward
    let trendLength = Math.floor(Math.random() * 10) + 5; // 5 to 15 iterations
    let trendStrength = Math.random() * 0.02 + 0.01; // 1% to 3% per step

    // Track start time if not already set
    if (!simulatePriceChange.startTime) {
        simulatePriceChange.startTime = Date.now(); // Record the program's start time in milliseconds
    }

    // Calculate elapsed time in seconds
    const elapsedTime = (Date.now() - simulatePriceChange.startTime) / 10;

    // Function to calculate dynamic probability that toggles every minute
    function getDynamicProbability(elapsed) {
        const minutes = Math.floor(elapsed / 60); // Get elapsed time in whole minutes
        return minutes % 2 === 0 ? 0.58 : 0.45; // Alternate between 0.7 and 0.5 every minute
    }

    // Calculate dynamic probability based on elapsed time
    let dynamicProbability = getDynamicProbability(elapsedTime);

    // Debug the calculated probability and elapsed time
    console.debug(`Dynamic Probability after ${elapsedTime.toFixed(1)} seconds is ${dynamicProbability}`);

    // Minor fluctuations outside of trends
    let fluctuationStrength = Math.random() * 0.005 * (Math.random() < dynamicProbability ? -1 : 1);

    // Spike/Dip Probability
    const spikeProbability = 0.005;
    const spikeMagnitude = Math.random() * 0.1 + 0.05; // 5% to 15%

    // Track trend state
    if (!simulatePriceChange.trendState) {
        simulatePriceChange.trendState = {
            remaining: trendLength,
            direction: trendDirection,
        };
    }

    let changePercentage;

    // Apply trend if active
    if (simulatePriceChange.trendState.remaining > 0) {
        changePercentage = simulatePriceChange.trendState.direction * trendStrength;
        simulatePriceChange.trendState.remaining--;
    } else {
        // Reset trend when it ends
        simulatePriceChange.trendState = {
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
    const fastIncreaseMultiplier = 1.01; // Boost price faster
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

    // Format price for low-value assets
    return Math.max(newPrice, 0.0000000000001); // Ensure no negative or near-zero prices
}

// Periodically update prices
function updatePrices() {
    for (const currency in prices) {
        prices[currency] = simulatePriceChange(prices[currency], currency);
    }
    console.log('Updated prices:', prices);
}

setInterval(updatePrices, 1000); // Update prices every second

// Endpoint to get the prices
app.get('/prices', (req, res) => {
    res.json(prices);
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
    fetch('https://bitthemarket.com/notify-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
    fetch('https://bitthemarket.com/notify-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction),
    });

    res.json({
        message: 'Sell order successful!',
        holdings: userHoldings,
    });
});

// Store historical price data
const historicalPrices = {
    BTC: [],
    ETH: [],
    DOGE: [],
    SHIB: [],
    TON: [],
    TRX: [],
    LTC: [],
    LUNA: [],
    BC: [],
    // Add other currencies as needed
};

// Calculate percentage change function
function calculatePercentageChange(current, previous) {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

// Function to calculate changes based on historical data
function calculateChanges(prices, intervals) {
    const changes = {};

    for (const [currency, priceHistory] of Object.entries(historicalPrices)) {
        changes[currency] = {};

        // Ensure price history has enough data
        if (priceHistory.length > 0) {
            const currentPrice = prices[currency];

            intervals.forEach(([label, count]) => {
                const historicalPrice = count === 'All' 
                    ? priceHistory[0] // First recorded price
                    : priceHistory[priceHistory.length - count] || priceHistory[0]; // Fallback if not enough data

                changes[currency][label] = calculatePercentageChange(currentPrice, historicalPrice);
            });
        }
    }

    return changes;
}

// Update historical prices periodically
function updateHistoricalPrices() {
    for (const currency in prices) {
        if (!historicalPrices[currency]) {
            historicalPrices[currency] = [];
        }

        historicalPrices[currency].push(prices[currency]);

        // Limit the size of historical prices to 8640 (1 year of hourly data)
        if (historicalPrices[currency].length > 8640) {
            historicalPrices[currency].shift();
        }
    }
}

setInterval(updateHistoricalPrices, 1000); // Update every hour

// Endpoint to calculate and return price changes
app.get('/price-changes', (req, res) => {
    const intervals = [
        ['24H', 24],
        ['7D', 168],
        ['1M', 720],
        ['1Y', 8640],
        ['All', 'All'],
    ];

    const changes = calculateChanges(prices, intervals);
    res.json(changes);
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

app.get('/prices/:pair', (req, res) => {
    const pair = req.params.pair;
    const [baseCurrency] = pair.split('/');
    if (historicalPrices[baseCurrency]) {
        res.json(historicalPrices[baseCurrency].map((price, index) => ({
            price,
            timestamp: Date.now() - ((historicalPrices[baseCurrency].length - 1 - index) * 1000), // Example timestamp logic
        })));
    } else {
        res.status(404).send('Pair not found');
    }
});


// Store historical balances
const historicalBalances = [];

// Function to calculate the current estimated balance
function calculateEstimatedBalance() {
    return Object.entries(userHoldings).reduce((total, [currency, holding]) => {
        const price = prices[currency] || 0;
        return total + holding * price;
    }, 0);
}

// Periodically update historical balances
function updateHistoricalBalances() {
    const estimatedBalance = calculateEstimatedBalance();
    historicalBalances.push({
        balance: estimatedBalance,
        timestamp: Date.now(),
    });

    // Limit the size of the historical balances to 8640 (1 year of hourly data)
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