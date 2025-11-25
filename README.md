# Novadashboard

This project is a web dashboard created to study and understand the Bitcoin protocol. It interacts directly with a running `bitcoind` or `bitcoin-qt` node, using it as a reference implementation to explore blockchain data, network status, and transaction handling.

## Architecture

The project follows **Clean Architecture** principles to ensure scalability, maintainability, and testability:

- **Controllers**: Handle HTTP requests and responses.
- **Services**: Contain business logic and orchestrate data flow.
- **Repositories**: Handle data access and communication with external systems (Bitcoin Core).
- **Dependency Injection**: Dependencies are injected to facilitate testing and decoupling.

## Features

- Displays general information about the Bitcoin blockchain, network, and mempool.
- Shows the latest blocks and the current top transactions in the mempool.
- Allows users to look up blocks by hash (including a shortcut for the Genesis Block).
- Allows users to look up transactions by ID (TXID).

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Templating**: EJS
- **Testing**: Native Node.js Test Runner (`node:test`)
- **Bitcoin Client**: `bitcoin-core`

## Requirements

- Node.js (v20+ recommended for native test runner support).
- A running Bitcoin Core node. RPC must be enabled in your `bitcoin.conf` file.
- RPC credentials (username and password).

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/jmolinasoler/Novadash.git
    cd Novadash
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the project root and add your Bitcoin Core RPC credentials:

    ```env
    RPC_HOST=http://127.0.0.1
    RPC_PORT=8332
    RPC_USER=your_rpc_username
    RPC_PASSWORD=your_rpc_password
    ```

## Usage

1. Start the application:

    ```bash
    node index.js
    ```

2. Open your web browser and go to `http://localhost:3000`.

## Testing

The project uses the native Node.js test runner. To run the tests:

```bash
npm test
```

## Troubleshooting

If you encounter issues connecting to your Bitcoin Core node, please refer to the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide.

## License

This project is licensed under the [MIT License](LICENSE).
