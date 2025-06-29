const BitcoinCore = require('bitcoin-core');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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

/**
 * Fetches the latest N blocks from the node.
 * @param {number} currentHeight The current blockchain height.
 * @param {number} numBlocksToFetch The number of recent blocks to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of block headers.
 */
async function fetchLatestBlocks(currentHeight, numBlocksToFetch = 20) {
    const blockPromises = [];

    for (let i = 0; i < numBlocksToFetch; i++) {
        const height = currentHeight - i;
        if (height >= 0) { // Ensure we don't go below block 0
            blockPromises.push(
                client.getBlockHash(height)
                    .then(hash => client.getBlockHeader(hash))
                    .catch(err => {
                        console.error(`Error fetching block at height ${height}:`, err.message);
                        return null; // Return null for failed fetches
                    })
            );
        }
    }
    const rawLatestBlocks = await Promise.all(blockPromises);
    return rawLatestBlocks
        .filter(block => block !== null)
        .map(block => ({
            height: block.height,
            hash: block.hash,
            time: block.time,
            nTx: block.nTx
        }));
}

/**
 * Fetches and processes all the data needed for the main dashboard view.
 */
async function getDashboardData(numItemsToFetch = 20) {
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
        .slice(0, numItemsToFetch);

    const latestBlocks = await fetchLatestBlocks(blockchainInfo.blocks, numItemsToFetch);

    return { blockchainInfo, networkInfo, mempoolInfo, mempoolTransactions, latestBlocks };
}

/**
 * Fetches data that is updated frequently (blocks, mempool, and basic chain info).
 * This is a lighter version of getDashboardData for API polling.
 * @param {number} numItemsToFetch The number of items to fetch for blocks and mempool.
 * @returns {Promise<Object>} A promise that resolves to the dynamic data.
 */
async function getDynamicData(numItemsToFetch = 20) {
    const [blockchainInfo, mempoolInfo, rawMempoolContent] = await Promise.all([
        client.getBlockchainInfo(),
        client.getMempoolInfo(),
        client.getRawMempool(true)
    ]);

    const mempoolTransactions = Object.entries(rawMempoolContent)
        .map(([txid, details]) => ({
            txid,
            feeRate: (details.fees.base * 100000000) / details.vsize,
            vsize: details.vsize,
            time: details.time
        }))
        .sort((a, b) => b.feeRate - a.feeRate)
        .slice(0, numItemsToFetch);

    const latestBlocks = await fetchLatestBlocks(blockchainInfo.blocks, numItemsToFetch);

    return { latestBlocks, mempoolTransactions, blockchainInfo, mempoolInfo };
}

/**
 * Fetches a full block by its hash.
 * @param {string} hash The block hash.
 * @returns {Promise<Object>} A promise that resolves to the full block object.
 */
async function getBlock(hash) {
    // Verbosity 2 gets the full transaction objects within the block
    return client.getBlock(hash, 2);
}

/**
 * Fetches a raw transaction by its ID.
 * @param {string} txid The transaction ID.
 * @returns {Promise<Object>} A promise that resolves to the decoded transaction object.
 */
async function getRawTransaction(txid) {
    // Verbose = true gets a decoded JSON object
    return client.getRawTransaction(txid, true);
}

module.exports = {
    getDashboardData,
    getDynamicData,
    getBlock,
    getRawTransaction,
};