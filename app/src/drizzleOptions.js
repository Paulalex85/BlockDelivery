import Web3 from "web3";
import DeliveryContract from "./contracts/DeliveryContract.json";

const options = {
    web3: {
        block: false,
        customProvider: new Web3("ws://localhost:8545"),
    },
    contracts: [DeliveryContract],
    // events: {
  //     SimpleStorage: ["StorageSet"],
  // },
    polls: {
        accounts: 1500,
    },
};

export default options;
