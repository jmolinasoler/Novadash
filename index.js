import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { BitcoinRepository } from './repositories/bitcoinRepository.js';
import { DashboardService } from './services/dashboardService.js';
import { DashboardController } from './controllers/dashboardController.js';
import { createRoutes } from './routes/index.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (for CSS)
app.use(express.static(path.join(__dirname, 'public')));

// --- Dependency Injection ---
const { RPC_HOST, RPC_PORT, RPC_USER, RPC_PASSWORD } = process.env;

if (!RPC_USER || !RPC_PASSWORD) {
    console.error("FATAL: RPC_USER and RPC_PASSWORD are not set in the .env file.");
    process.exit(1);
}

const bitcoinConfig = {
    host: RPC_HOST,
    port: RPC_PORT,
    username: RPC_USER,
    password: RPC_PASSWORD,
};

const bitcoinRepository = new BitcoinRepository(bitcoinConfig);
const dashboardService = new DashboardService(bitcoinRepository);
const dashboardController = new DashboardController(dashboardService);

// --- Routes ---
app.use('/', createRoutes(dashboardController));

// Start the server
app.listen(port, () => {
    console.log(`Novadashboard running at http://localhost:${port}`);
});