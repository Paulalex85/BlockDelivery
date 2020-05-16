const path = require("path");

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    contracts_build_directory: path.join(__dirname, "app/src/contracts"),
    networks: {
        develop: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*", // Match any network id
        }
    },
    compilers: {
        solc: {
            version: "0.6.7",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 400   // Optimize for how many times you intend to run the code
                }
            }
        }
    },
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions: {
            currency: 'USD'
        }
    },
    plugins: ["solidity-coverage", "truffle-security"]
};
