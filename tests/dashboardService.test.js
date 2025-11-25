import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DashboardService } from '../services/dashboardService.js';

describe('DashboardService', () => {
    let mockRepository;
    let dashboardService;

    before(() => {
        mockRepository = {
            getBlockchainInfo: async () => ({ blocks: 100 }),
            getNetworkInfo: async () => ({ version: 220000 }),
            getMempoolInfo: async () => ({ size: 500 }),
            getRawMempool: async () => ({
                'tx1': { fees: { base: 0.0001 }, vsize: 200, time: 1234567890 },
                'tx2': { fees: { base: 0.0002 }, vsize: 250, time: 1234567891 }
            }),
            getBlockHash: async (height) => `hash${height}`,
            getBlockHeader: async (hash) => ({ height: 100, hash, time: 1234567890, nTx: 10 }),
            getBlock: async (hash) => ({ hash, height: 100 }),
            getRawTransaction: async (txid) => ({ txid })
        };
        dashboardService = new DashboardService(mockRepository);
    });

    it('should fetch dashboard data correctly', async () => {
        const data = await dashboardService.getDashboardData();
        assert.ok(data.blockchainInfo);
        assert.equal(data.blockchainInfo.blocks, 100);
        assert.ok(data.networkInfo);
        assert.ok(data.mempoolInfo);
        assert.ok(data.mempoolTransactions);
        assert.equal(data.mempoolTransactions.length, 2);
        assert.ok(data.latestBlocks);
    });

    it('should fetch dynamic data correctly', async () => {
        const data = await dashboardService.getDynamicData();
        assert.ok(data.latestBlocks);
        assert.ok(data.mempoolTransactions);
        assert.ok(data.blockchainInfo);
        assert.ok(data.mempoolInfo);
    });

    it('should fetch block details', async () => {
        const block = await dashboardService.getBlock('somehash');
        assert.equal(block.hash, 'somehash');
    });

    it('should fetch transaction details', async () => {
        const tx = await dashboardService.getTransaction('sometxid');
        assert.equal(tx.txid, 'sometxid');
    });
});
