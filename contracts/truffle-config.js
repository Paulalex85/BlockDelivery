const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config()

const INFURA_ID = 'c668ee6214a74e1c89726b345a5aed66';
module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    contracts_build_directory: path.join(__dirname, "../app/src/contracts"),
    networks: {
        develop: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "1337",
            accounts: 5,
        },
        ropsten: {
            provider: () => {
                return new HDWalletProvider({
                    mnemonic: {
                        phrase: process.env.TESTNET_MNEMONIC
                    },
                    providerOrUrl: "https://ropsten.infura.io/v3/" + INFURA_ID
                });
            },
            network_id: 3,
            // gas: 4500000,
            // gasPrice: 10000000000,
        }
    },
    compilers: {
        solc: {
            version: "0.6.7",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 10   // Optimize for how many times you intend to run the code
                }
            }
        }
    },
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions: {
            currency: 'USD',
            gasPrice: 20,
            excludeContracts: ['Migrations']
        }
    },
    plugins: ["solidity-coverage"]
};
