import BitcoinCore from 'bitcoin-core';

export class BitcoinRepository {
    constructor(config) {
        this.client = new BitcoinCore(config);
    }

    async getBlockchainInfo() {
        return this.client.getBlockchainInfo();
    }

    async getNetworkInfo() {
        return this.client.getNetworkInfo();
    }

    async getMempoolInfo() {
        return this.client.getMempoolInfo();
    }

    async getRawMempool(verbose = false) {
        return this.client.getRawMempool(verbose);
    }

    async getBlockHash(height) {
        return this.client.getBlockHash(height);
    }

    async getBlockHeader(hash) {
        return this.client.getBlockHeader(hash);
    }

    async getBlock(hash, verbosity = 1) {
        return this.client.getBlock(hash, verbosity);
    }

    async getRawTransaction(txid, verbose = false) {
        return this.client.getRawTransaction(txid, verbose);
    }
}
