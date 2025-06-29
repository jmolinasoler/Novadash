const bitcoin = require('../models/bitcoin');

/**
 * Renders the main dashboard page with the latest data.
 */
const showDashboard = async (req, res) => {
    try {
        const data = await bitcoin.getDashboardData();
        res.render('index', { ...data, blockDetails: null, txDetails: null, error: null });
    } catch (error) {
        console.error("Error connecting to Bitcoin Core:", error.message);
        res.render('index', {
            blockchainInfo: null, networkInfo: null, mempoolInfo: null, mempoolTransactions: null, latestBlocks: [],
            blockDetails: null, txDetails: null,
            error: `Could not connect to Bitcoin Core. Is it running? Are your .env credentials correct? \n\nDetails: ${error.message}`
        });
    }
};

/**
 * Handles the block lookup request.
 */
const lookupBlock = async (req, res) => {
    const { blockhash } = req.body;
    let blockDetails = null;
    let lookupError = null;

    try {
        blockDetails = await bitcoin.getBlock(blockhash);
    } catch (error) {
        console.error(`Error in lookupBlock for hash ${blockhash}:`, error.message);
        lookupError = `Error fetching block "${blockhash}": ${error.message}`;
    }

    try {
        const data = await bitcoin.getDashboardData();
        res.render('index', {
            ...data,
            blockDetails,
            txDetails: null,
            error: lookupError
        });
    } catch (error) {
        console.error("Error connecting to Bitcoin Core during block lookup:", error.message);
        res.render('index', {
            blockchainInfo: null, networkInfo: null, mempoolInfo: null, mempoolTransactions: null, latestBlocks: [],
            blockDetails: null, txDetails: null,
            error: `Could not connect to Bitcoin Core. Is it running? Are your .env credentials correct? \n\nDetails: ${error.message}`
        });
    }
};

/**
 * Handles the transaction lookup request.
 */
const lookupTx = async (req, res) => {
    const { txid } = req.body;
    let txDetails = null;
    let lookupError = null;

    try {
        txDetails = await bitcoin.getRawTransaction(txid);
    } catch (error) {
        console.error(`Error in lookupTx for txid ${txid}:`, error.message);
        lookupError = `Error fetching transaction "${txid}": ${error.message}`;
    }

    try {
        const data = await bitcoin.getDashboardData();
        res.render('index', {
            ...data,
            blockDetails: null,
            txDetails,
            error: lookupError
        });
    } catch (error) {
        console.error("Error connecting to Bitcoin Core during transaction lookup:", error.message);
        res.render('index', {
            blockchainInfo: null, networkInfo: null, mempoolInfo: null, mempoolTransactions: null, latestBlocks: [],
            blockDetails: null, txDetails: null,
            error: `Could not connect to Bitcoin Core. Is it running? Are your .env credentials correct? \n\nDetails: ${error.message}`
        });
    }
};

/**
 * Provides latest blocks and mempool data as a JSON API endpoint for polling.
 */
const getApiUpdate = async (req, res) => {
    try {
        const data = await bitcoin.getDynamicData();
        res.json(data);
    } catch (error) {
        console.error("Error fetching API update:", error.message);
        res.status(500).json({
            error: 'Failed to fetch update from Bitcoin Core.'
        });
    }
};

module.exports = {
    showDashboard,
    lookupBlock,
    lookupTx,
    getApiUpdate,
};