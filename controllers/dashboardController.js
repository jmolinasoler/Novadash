export class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }

    async showDashboard(req, res) {
        try {
            const data = await this.dashboardService.getDashboardData();
            res.render('index', { ...data, blockDetails: null, txDetails: null, error: null });
        } catch (error) {
            console.error("Error connecting to Bitcoin Core:", error.message);
            res.render('index', {
                blockchainInfo: null, networkInfo: null, mempoolInfo: null, mempoolTransactions: null, latestBlocks: [],
                blockDetails: null, txDetails: null,
                error: `Could not connect to Bitcoin Core. Is it running? Are your .env credentials correct? \n\nDetails: ${error.message}`
            });
        }
    }

    async lookupBlock(req, res) {
        const { blockhash } = req.body;
        let blockDetails = null;
        let lookupError = null;

        try {
            blockDetails = await this.dashboardService.getBlock(blockhash);
        } catch (error) {
            console.error(`Error in lookupBlock for hash ${blockhash}:`, error.message);
            lookupError = `Error fetching block "${blockhash}": ${error.message}`;
        }

        try {
            const data = await this.dashboardService.getDashboardData();
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
    }

    async lookupTx(req, res) {
        const { txid } = req.body;
        let txDetails = null;
        let lookupError = null;

        try {
            txDetails = await this.dashboardService.getTransaction(txid);
        } catch (error) {
            console.error(`Error in lookupTx for txid ${txid}:`, error.message);
            lookupError = `Error fetching transaction "${txid}": ${error.message}`;
        }

        try {
            const data = await this.dashboardService.getDashboardData();
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
    }

    async getApiUpdate(req, res) {
        try {
            const data = await this.dashboardService.getDynamicData();
            res.json(data);
        } catch (error) {
            console.error("Error fetching API update:", error.message);
            res.status(500).json({
                error: 'Failed to fetch update from Bitcoin Core.'
            });
        }
    }
}