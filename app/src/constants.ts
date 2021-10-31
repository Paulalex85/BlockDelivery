import { TListNetwork, TNetwork } from './models';
// export const ETHERSCAN_KEY = "";

export const NETWORK = (chainId: number): TNetwork => {
    for (const n in NETWORKS) {
        if (NETWORKS[n].chainId === chainId) {
            return NETWORKS[n];
        }
    }
    return {
        name: 'unknown',
        color: '#ceb0fa',
        chainId: 0,
        rpcUrl: '',
        blockExplorer: 'https://etherscan.io/',
    };
};

export const NETWORKS: TListNetwork = {
    // ethereum: {
    //     name: 'ethereum',
    //     color: '#ceb0fa',
    //     chainId: 1,
    //     // price: 'uniswap',
    //     rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    //     blockExplorer: 'https://etherscan.io/',
    // },
    // kovan: {
    //     name: 'kovan',
    //     color: '#7003DD',
    //     chainId: 42,
    //     rpcUrl: `https://kovan.infura.io/v3/${INFURA_ID}`,
    //     blockExplorer: 'https://kovan.etherscan.io/',
    //     faucet: 'https://gitter.im/kovan-testnet/faucet', // https://faucet.kovan.network/
    // },
    // rinkeby: {
    //     name: 'rinkeby',
    //     color: '#e0d068',
    //     chainId: 4,
    //     rpcUrl: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
    //     faucet: 'https://faucet.rinkeby.io/',
    //     blockExplorer: 'https://rinkeby.etherscan.io/',
    // },
    ropsten: {
        name: 'ropsten',
        color: '#ff4a8d',
        chainId: 3,
        faucet: 'https://faucet.ropsten.be/',
        blockExplorer: 'https://ropsten.etherscan.io/',
        rpcUrl: process.env.REACT_APP_ALCHEMY_KEY || '',
    },
    // goerli: {
    //     name: 'goerli',
    //     color: '#0975F6',
    //     chainId: 5,
    //     faucet: 'https://goerli-faucet.slock.it/',
    //     blockExplorer: 'https://goerli.etherscan.io/',
    //     rpcUrl: `https://goerli.infura.io/v3/${INFURA_ID}`,
    // },
    localhost: {
        name: 'localhost',
        color: '#666666',
        // price: 'uniswap', // use mainnet eth price for localhost
        chainId: 1337,
        blockExplorer: '',
        rpcUrl: 'http://localhost:8545',
    },
};
