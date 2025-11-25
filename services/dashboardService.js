export class DashboardService {
    constructor(bitcoinRepository) {
        this.bitcoinRepository = bitcoinRepository;
    }

    async fetchLatestBlocks(currentHeight, numBlocksToFetch = 20) {
        const blockPromises = [];

        for (let i = 0; i < numBlocksToFetch; i++) {
            const height = currentHeight - i;
            if (height >= 0) {
                blockPromises.push(
                    this.bitcoinRepository.getBlockHash(height)
                        .then(hash => this.bitcoinRepository.getBlockHeader(hash))
                        .catch(err => {
                            console.error(`Error fetching block at height ${height}:`, err.message);
                            return null;
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

    async getDashboardData(numItemsToFetch = 20) {
        const [blockchainInfo, networkInfo, mempoolInfo, rawMempoolContent] = await Promise.all([
            this.bitcoinRepository.getBlockchainInfo(),
            this.bitcoinRepository.getNetworkInfo(),
            this.bitcoinRepository.getMempoolInfo(),
            this.bitcoinRepository.getRawMempool(true)
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

        const latestBlocks = await this.fetchLatestBlocks(blockchainInfo.blocks, numItemsToFetch);

        return { blockchainInfo, networkInfo, mempoolInfo, mempoolTransactions, latestBlocks };
    }

    async getDynamicData(numItemsToFetch = 20) {
        const [blockchainInfo, mempoolInfo, rawMempoolContent] = await Promise.all([
            this.bitcoinRepository.getBlockchainInfo(),
            this.bitcoinRepository.getMempoolInfo(),
            this.bitcoinRepository.getRawMempool(true)
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

        const latestBlocks = await this.fetchLatestBlocks(blockchainInfo.blocks, numItemsToFetch);

        return { latestBlocks, mempoolTransactions, blockchainInfo, mempoolInfo };
    }

    async getBlock(hash) {
        return this.bitcoinRepository.getBlock(hash, 2);
    }

    async getTransaction(txid) {
        return this.bitcoinRepository.getRawTransaction(txid, true);
    }
}
