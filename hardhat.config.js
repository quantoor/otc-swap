require("@nomicfoundation/hardhat-toolbox")
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-etherscan")
require("solidity-coverage")
require("hardhat-deploy")
require("dotenv").config()

const PRIVATE_KEY = process.env.PRIVATE_KEY
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        },
    },
    solidity: "0.8.18",
}
