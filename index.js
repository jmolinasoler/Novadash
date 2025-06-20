const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const BitcoinCore = require('bitcoin-core');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (for CSS)
app.use(express.static(path.join(__dirname, 'public')));

// --- Bitcoin Core Client Setup ---
const { RPC_HOST, RPC_PORT, RPC_USER, RPC_PASSWORD } = process.env;

if (!RPC_USER || !RPC_PASSWORD) {
    console.error("FATAL: RPC_USER and RPC_PASSWORD are not set in the .env file.");
    process.exit(1);
}

const client = new BitcoinCore({
    host: RPC_HOST,
    port: RPC_PORT,
    username: RPC_USER,
    password: RPC_PASSWORD,
});

// --- Routes ---

// Main dashboard route
app.get('/', async (req, res) => {
    try {
        // Fetch all general info in parallel for speed
        const [blockchainInfo, networkInfo, mempoolInfo] = await Promise.all([
            client.getBlockchainInfo(),
            client.getNetworkInfo(),
            client.getMempoolInfo()
        ]);

        res.render('index', {
            blockchainInfo,
            networkInfo,
            mempoolInfo,
            blockDetails: null, // No specific block to show initially
            txDetails: null,    // No specific tx to show initially
            error: null
        });

    } catch (error) {
        console.error("Error connecting to Bitcoin Core:", error.message);
        res.render('index', {
            blockchainInfo: null,
            networkInfo: null,
            mempoolInfo: null,
            blockDetails: null,
            txDetails: null,
            error: `Could not connect to Bitcoin Core. Is it running? Are your .env credentials correct? \n\nDetails: ${error.message}`
        });
    }
});

// Route to handle block lookup
app.post('/block', async (req, res) => {
    const { blockhash } = req.body;
    let blockDetails = null;
    let lookupError = null;

    try {
        // Use verbosity level 2 to get full transaction objects
        blockDetails = await client.getBlock(blockhash, 2);
    } catch (error) {
        lookupError = `Error fetching block "${blockhash}": ${error.message}`;
    }

    // Re-render the main page with the new block details
    const [blockchainInfo, networkInfo, mempoolInfo] = await Promise.all([
        client.getBlockchainInfo(),
        client.getNetworkInfo(),
        client.getMempoolInfo()
    ]);

    res.render('index', {
        blockchainInfo,
        networkInfo,
        mempoolInfo,
        blockDetails,
        txDetails: null,
        error: lookupError // Show lookup error specifically if it occurs
    });
});

// Route to handle transaction lookup
app.post('/tx', async (req, res) => {
    const { txid } = req.body;
    let txDetails = null;
    let lookupError = null;

    try {
        // Use verbose=true to get a decoded transaction object
        txDetails = await client.getRawTransaction(txid, true);
    } catch (error) {
        lookupError = `Error fetching transaction "${txid}": ${error.message}`;
    }

    // Re-render the main page with the new transaction details
    const [blockchainInfo, networkInfo, mempoolInfo] = await Promise.all([
        client.getBlockchainInfo(),
        client.getNetworkInfo(),
        client.getMempoolInfo()
    ]);

    res.render('index', {
        blockchainInfo,
        networkInfo,
        mempoolInfo,
        blockDetails: null,
        txDetails,
        error: lookupError
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Novadashboard running at http://localhost:${port}`);
});