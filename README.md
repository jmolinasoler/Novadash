 # Novadashboard
 
 This project is a simple web dashboard created to help me study and understand the Bitcoin protocol. It interacts directly with a running `bitcoin-core` node, using it as a reference implementation to explore blockchain data, network status, and transaction handling.
 
 ## Features
 
 *   Displays general information about the Bitcoin blockchain, network, and mempool.
 *   Shows the latest blocks and the current top transactions in the mempool.
 *   Allows users to look up blocks by hash (including a shortcut for the Genesis Block).
 *   Allows users to look up transactions by ID (TXID).
 
 ## Requirements
 
 *   Node.js and npm installed.
 *   A running Bitcoin Core node. This application is designed to connect to your own node to display its data. RPC must be enabled in your `bitcoin.conf` file.
 *   RPC credentials (username and password) from your `bitcoin.conf` file.
 
 ## Installation
 
 1.  Clone the repository:
 
     ```bash
     git clone https://github.com/jmolinasoler/Novadash.git
     cd Novadashboard
     ```
 
 2.  Install dependencies:
 
     ```bash
     npm install
     ```
 
 3.  Create a `.env` file in the project root and add your Bitcoin Core RPC credentials:
 
     ```
     RPC_HOST=http://127.0.0.1
     RPC_PORT=8332
     RPC_USER=your_rpc_username
     RPC_PASSWORD=your_rpc_password
     ```
     Replace `your_rpc_username` and `your_rpc_password` with your actual RPC credentials.  Ensure that your RPC host includes the `http://` or `https://` prefix, and matches the setting in your `bitcoin.conf` file.
 
 ## Usage
 
 1.  Start the application:
 
     ```bash
     node index.js
     ```
 
 2.  Open your web browser and go to `http://localhost:3000`.
 
 ## Development
 
 To run the application in development mode:
 
 ```bash
 node index.js 
 ```
 
 This will start the server, and you can view the dashboard in your browser.
 
 ## Contributing
 
 Contributions are welcome! Please open an issue or submit a pull request for any bugs or improvements.
 
 ## License
 
 [MIT](LICENSE)