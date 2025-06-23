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

// --- Helper Functions ---

/**
 * Fetches and processes all the data needed for the main dashboard view.
 */
async function getDashboardData(numBlocksToFetch = 20) {
    const [blockchainInfo, networkInfo, mempoolInfo, rawMempoolContent] = await Promise.all([
        client.getBlockchainInfo(),
        client.getNetworkInfo(),
        client.getMempoolInfo(),
        client.getRawMempool(true)
    ]);

    // Process mempool data: sort by fee rate and select the top 20
    const mempoolTransactions = Object.entries(rawMempoolContent)
        .map(([txid, details]) => ({
            txid,
            // Calculate fee rate in satoshis per virtual byte
            feeRate: (details.fees.base * 100000000) / details.vsize,
            vsize: details.vsize,
            time: details.time
        }))
        .sort((a, b) => b.feeRate - a.feeRate)
        .slice(0, numBlocksToFetch); // Use numBlocksToFetch for consistency, though mempool is usually top N

    // Fetch last N blocks
    const latestBlocks = [];
    const currentHeight = blockchainInfo.blocks;
    const blockPromises = [];

    for (let i = 0; i < numBlocksToFetch; i++) {
        const height = currentHeight - i;
        if (height >= 0) { // Ensure we don't go below block 0
            blockPromises.push(
                client.getBlockHash(height)
                    .then(hash => client.getBlockHeader(hash)) // getBlockHeader is lighter and has nTx
                    .catch(err => {
                        console.error(`Error fetching block at height ${height}:`, err.message);
                        return null; // Return null for failed fetches
                    })
            );
        }
    }
    const rawLatestBlocks = await Promise.all(blockPromises);
    const processedLatestBlocks = rawLatestBlocks
        .filter(block => block !== null)
        .map(block => ({
            height: block.height,
            hash: block.hash,
            time: block.time,
            nTx: block.nTx // Number of transactions in the block
        }));

    return { blockchainInfo, networkInfo, mempoolInfo, mempoolTransactions, latestBlocks: processedLatestBlocks };
}

// Main dashboard route
app.get('/', async (req, res) => {
    try {
        const data = await getDashboardData();
        res.render('index', { ...data, blockDetails: null, txDetails: null, error: null });
    } catch (error) { // Catch errors from getDashboardData
        console.error("Error connecting to Bitcoin Core:", error.message);
        res.render('index', {
            blockchainInfo: null, networkInfo: null, mempoolInfo: null, mempoolTransactions: null,
            blockDetails: null, txDetails: null,
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

    const data = await getDashboardData();
    res.render('index', {
        ...data,
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

    const data = await getDashboardData();
    res.render('index', {
        ...data,
        blockDetails: null,
        txDetails,
        error: lookupError
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Novadashboard running at http://localhost:${port}`);
});