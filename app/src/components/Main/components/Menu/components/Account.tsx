import React, { useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { Button, Navbar } from 'react-bootstrap';
import Balance from './Balance';
import Address from './Address';
import Network from './Network';

const web3Modal = new Web3Modal({
    //network: "mainnet", // optional
    cacheProvider: true, // optional
    providerOptions: {
        walletconnect: {
            package: WalletConnectProvider, // required
            options: {
                apiKey: process.env.REACT_APP_ALCHEMY_KEY,
                // infuraId: INFURA_ID,
            },
        },
    },
});

type AccountProps = {
    userProvider: any;
    setInjectedProvider: any;
    minimized?: boolean;
};

const Account = ({ userProvider, setInjectedProvider, minimized = false }: AccountProps) => {
    const loadWeb3Modal = useCallback(async () => {
        const provider = await web3Modal.connect();
        setInjectedProvider(new ethers.providers.Web3Provider(provider));
    }, [setInjectedProvider]);

    const logoutOfWeb3Modal = async () => {
        await web3Modal.clearCachedProvider();
        setTimeout(() => {
            window.location.reload();
        }, 1);
    };

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            loadWeb3Modal().then();
        }
    }, [loadWeb3Modal]);

    let modalButtons;
    if (web3Modal.cachedProvider) {
        modalButtons = (
            <Button key="logoutbutton" variant="outline-primary" onClick={logoutOfWeb3Modal}>
                Logout
            </Button>
        );
    } else {
        modalButtons = (
            <Button key="loginbutton" variant="primary" onClick={loadWeb3Modal}>
                Connect
            </Button>
        );
    }

    let display = undefined;
    if (!minimized) {
        display = (
            <Navbar.Text>
                <Address size="short" />
                <Balance provider={userProvider} />
                <Network userProvider={userProvider} />
            </Navbar.Text>
        );
    }

    return (
        <div>
            {display}
            {modalButtons}
        </div>
    );
};

export default Account;
