import express from 'express';

export const createRoutes = (dashboardController) => {
    const router = express.Router();

    router.get('/', (req, res) => dashboardController.showDashboard(req, res));
    router.post('/lookup-block', (req, res) => dashboardController.lookupBlock(req, res));
    router.post('/lookup-tx', (req, res) => dashboardController.lookupTx(req, res));
    router.get('/api/update', (req, res) => dashboardController.getApiUpdate(req, res));

    return router;
};