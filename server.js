const express = require('express');
const cors = require('cors');
const events = require('events');
const app = express();

app.use(cors());
app.use(express.json());

// --- DATA STORAGE ---

// Simulation-only holdings
let holdings = {
    BTC: 0,
    ETH: 0,
    DOGE: 0,
    SHIB: 0,
    TON: 0,
    TRX: 0,
    LTC: 0,
    LUNA: 0,
    BC: 100, // Starting BC balance
    USDT: 10, // Starting USDT balance
};

// Casino-specific holdings (Bankroll inside the casino)
let casinoHoldings = {
    USDT: 0,
    BC: 0,
};

// Simulation prices
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

// Static exchange rates
let exchangeRates = {
    USDT: 1,
    USD: 0.9995,
    EUR: 0.92,
    SOL: 3.75
};

// Transaction History
const transactions = [];
const transactionEmitter = new events.EventEmitter();

// Historical Price Tracking (for charts)
const historicalPrices = {
    BTC: [], ETH: [], DOGE: [], SHIB: [], TON: [],
    TRX: [], LTC: [], LUNA: [], BC: [], USDT: [],
};
const historicalBalances = [];

// --- SIMULATION MATH & LOGIC ---

let marketHackMultiplier = 1;
let currentDynamicProbability = 0; 

let probabilityState = {
    targetProb: 0.58,
    duration: 0,
    remainingTime: 0,
    startTime: Date.now(),
    transitioning: false,
    startTransitionProb: 0,
    endTransitionProb: 0,
    transitionDuration: 0,
    transitionElapsedTime: 0
};

function generateRandomDuration() {
    return Math.floor(Math.random() * (45 - 30 + 1)) + 30;
}

function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB'); 
    const time = now.toLocaleTimeString('en-GB'); 
    return `${date} ${time}`;
}

function addTransaction(record) {
    transactions.unshift(record); // Newest first
    transactionEmitter.emit('newTransaction', record);
}

function simulatePriceChange(currentPrice, currency) {
    const currentTime = Date.now();
    const elapsedSinceLastUpdate = (currentTime - probabilityState.startTime) / 1000;

    // Probability Logic
    if (!probabilityState.transitioning) {
        if (elapsedSinceLastUpdate >= probabilityState.duration) {
            probabilityState.startTime = currentTime;
            probabilityState.transitioning = true;
            probabilityState.startTransitionProb = currentDynamicProbability;
            probabilityState.targetProb = probabilityState.targetProb === 0.58 ? 0.46 : 0.58;
            probabilityState.endTransitionProb = probabilityState.targetProb;
            probabilityState.transitionDuration = generateRandomDuration();
            probabilityState.transitionElapsedTime = 0;
        } else {
            currentDynamicProbability = probabilityState.targetProb * marketHackMultiplier;
        }
    } else {
        probabilityState.transitionElapsedTime += (currentTime - probabilityState.startTime) / 1000;
        probabilityState.startTime = currentTime;
        if (probabilityState.transitionElapsedTime >= probabilityState.transitionDuration) {
            currentDynamicProbability = probabilityState.endTransitionProb * marketHackMultiplier;
            probabilityState.transitioning = false;
            probabilityState.duration = generateRandomDuration();
        } else {
            const progress = probabilityState.transitionElapsedTime / probabilityState.transitionDuration;
            currentDynamicProbability = (probabilityState.startTransitionProb + (probabilityState.endTransitionProb - probabilityState.startTransitionProb) * progress) * marketHackMultiplier;
        }
    }

    let fluctuationStrength = Math.random() * 0.005 * (Math.random() < currentDynamicProbability ? -1 : 1);
    
    // Trend logic
    if (!simulatePriceChange.trendState) {
        simulatePriceChange.trendState = { remaining: 10, direction: 1 };
    }

    let changePercentage;
    if (simulatePriceChange.trendState.remaining > 0) {
        changePercentage = simulatePriceChange.trendState.direction * (Math.random() * 0.02 + 0.01);
        simulatePriceChange.trendState.remaining--;
    } else {
        simulatePriceChange.trendState = {
            remaining: Math.floor(Math.random() * 10) + 5,
            direction: Math.random() < currentDynamicProbability ? 1 : -1,
        };
        changePercentage = fluctuationStrength;
    }

    // Spike logic
    if (Math.random() < 0.005) {
        changePercentage += (Math.random() * 0.1 + 0.05) * (Math.random() < currentDynamicProbability ? -1 : 1);
    }

    let newPrice = currentPrice * (1 + changePercentage);

    // Hardcoded Stabilizers (from your original file)
    const slowDown = 0.999;
    if (newPrice >= 3857 && currency === 'ETH') newPrice *= slowDown;
    if (newPrice >= 5.75 && currency === 'DOGE') newPrice *= slowDown;
    if (newPrice >= 0.075 && currency === 'SHIB') newPrice *= slowDown;
    if (newPrice >= 15.12 && currency === 'TON') newPrice *= slowDown;
    if (newPrice >= 315.12 && (currency === 'TRX' || currency === 'LTC' || currency === 'LUNA')) newPrice *= slowDown;
    if (newPrice >= 100000 && (currency === 'BTC' || currency === 'BC')) newPrice *= slowDown;

    if (currency === 'USDT') return Math.random() * (1.001 - 0.999) + 0.999;
    return Math.max(newPrice, 0.0000000000001);
}

// --- INTERVALS ---

// Update Prices
setInterval(() => {
    for (const currency in prices) {
        prices[currency] = simulatePriceChange(prices[currency], currency);
    }
}, 1000);

// Update Historical Data
setInterval(() => {
    for (const currency in prices) {
        historicalPrices[currency].push(prices[currency]);
        if (historicalPrices[currency].length > 8640) historicalPrices[currency].shift();
    }
    const currentBalance = Object.entries(holdings).reduce((total, [curr, amt]) => total + (amt * prices[curr]), 0);
    historicalBalances.push({ balance: currentBalance, timestamp: Date.now() });
    if (historicalBalances.length > 8640) historicalBalances.shift();
}, 1000);

// --- ENDPOINTS ---

// 1. Market Data
app.get('/prices', (req, res) => res.json(prices));
app.get('/exchange-rates', (req, res) => res.json(exchangeRates));

app.get('/prices/:pair', (req, res) => {
    const [base] = req.params.pair.split('/');
    if (historicalPrices[base]) {
        res.json(historicalPrices[base].map((p, i) => ({
            price: p,
            timestamp: Date.now() - ((historicalPrices[base].length - 1 - i) * 1000),
        })));
    } else {
        res.status(404).send('Pair not found');
    }
});

// 2. Wallet & Transactions
app.get('/holdings', (req, res) => res.json({ wallet: holdings, casino: casinoHoldings }));
app.get('/transactions', (req, res) => res.json(transactions));

app.post('/deposit', (req, res) => {
    const { amount, currency } = req.body;
    holdings[currency] = (holdings[currency] || 0) + parseFloat(amount);
    addTransaction({
        orderDate: getCurrentDateTime(),
        type: 'Deposit',
        pair: currency,
        price: 'N/A',
        amount: `${amount} ${currency}`,
        total: `+${amount} ${currency}`
    });
    res.json({ message: 'Deposit successful', holdings });
});

app.post('/withdraw', (req, res) => {
    const { amount, currency, address } = req.body;
    if (holdings[currency] < amount) return res.status(400).json({ message: 'Insufficient funds' });
    holdings[currency] -= parseFloat(amount);
    addTransaction({
        orderDate: getCurrentDateTime(),
        type: 'Withdraw',
        pair: currency,
        price: 'N/A',
        amount: `${amount} ${currency}`,
        total: `-${amount} ${currency} to ${address.substring(0,8)}...`
    });
    res.json({ message: 'Withdrawal successful', holdings });
});

app.post('/buy', (req, res) => {
    const { pair, amount } = req.body;
    const [base, quote] = pair.split('/');
    const cost = amount * prices[base];
    if (holdings[quote] < cost) return res.status(400).json({ message: 'Insufficient USDT' });
    holdings[quote] -= cost;
    holdings[base] = (holdings[base] || 0) + parseFloat(amount);
    addTransaction({
        orderDate: getCurrentDateTime(),
        type: 'Buy',
        pair,
        price: `${prices[base].toFixed(6)} USDT`,
        amount: `${amount} ${base}`,
        total: `${cost.toFixed(2)} USDT`
    });
    res.json({ message: 'Purchase successful', holdings });
});

app.post('/sell', (req, res) => {
    const { pair, amount } = req.body;
    const [base, quote] = pair.split('/');
    const gain = amount * prices[base];
    if (holdings[base] < amount) return res.status(400).json({ message: 'Insufficient balance' });
    holdings[base] -= parseFloat(amount);
    holdings[quote] += gain;
    addTransaction({
        orderDate: getCurrentDateTime(),
        type: 'Sell',
        pair,
        price: `${prices[base].toFixed(6)} USDT`,
        amount: `${amount} ${base}`,
        total: `${gain.toFixed(2)} USDT`
    });
    res.json({ message: 'Sale successful', holdings });
});

// 3. Casino Logic
app.post('/transfer-to-casino', (req, res) => {
    const { amount, currency } = req.body;
    if (holdings[currency] < amount) return res.status(400).json({ message: 'Insufficient wallet balance' });
    holdings[currency] -= parseFloat(amount);
    casinoHoldings[currency] += parseFloat(amount);
    res.json({ message: 'Funds moved to Casino bankroll', holdings, casinoHoldings });
});

app.post('/transfer-to-wallet', (req, res) => {
    const { amount, currency } = req.body;
    if (casinoHoldings[currency] < amount) return res.status(400).json({ message: 'Insufficient casino balance' });
    casinoHoldings[currency] -= parseFloat(amount);
    holdings[currency] += parseFloat(amount);
    res.json({ message: 'Funds moved back to Main Wallet', holdings, casinoHoldings });
});

app.post('/casino/play', (req, res) => {
    const { amount, currency, game } = req.body;
    if (casinoHoldings[currency] < amount) return res.status(400).json({ message: 'Insufficient casino funds' });
    
    const win = Math.random() > 0.52; // House edge of 2%
    if (win) {
        casinoHoldings[currency] += parseFloat(amount); // Wins double
    } else {
        casinoHoldings[currency] -= parseFloat(amount);
    }
    
    res.json({ 
        result: win ? 'win' : 'lose', 
        amount: win ? amount : -amount,
        newBalance: casinoHoldings[currency] 
    });
});

// 4. System & SSE
app.get('/transactions/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const onNewTx = (tx) => res.write(`data: ${JSON.stringify(tx)}\n\n`);
    transactionEmitter.on('newTransaction', onNewTx);
    req.on('close', () => transactionEmitter.removeListener('newTransaction', onNewTx));
});

app.get('/balances', (req, res) => res.json(historicalBalances));

app.post('/market-hack', (req, res) => {
    const { direction } = req.body;
    marketHackMultiplier = (direction === 'up') ? 1.5 : 0.7;
    setTimeout(() => { marketHackMultiplier = 1; }, 60000);
    res.json({ message: `Market set to ${direction} for 60 seconds.` });
});

app.get('/dynamic-probability', (req, res) => res.json({ dynamicProbability: currentDynamicProbability }));

app.get('/', (req, res) => res.send('<h1>Bit The Market - Simulation Server</h1>'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Simulation Server running on port ${PORT}`);
});
