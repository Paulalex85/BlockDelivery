import React, {useEffect} from 'react'
import {ethers} from "ethers";
import BurnerProvider from 'burner-provider';
import Web3Modal from "web3modal";
import {usePoller} from "../../../../../hooks";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {Button, Navbar} from 'react-bootstrap';
import Balance from "./Balance";
import Address from "./Address";

const INFURA_ID = "c668ee6214a74e1c89726b345a5aed66";

const web3Modal = new Web3Modal({
    //network: "mainnet", // optional
    cacheProvider: true, // optional
    providerOptions: {
        walletconnect: {
            package: WalletConnectProvider, // required
            options: {
                infuraId: INFURA_ID
            }
        }
    }
});

type AccountProps = {
    address: string;
    setAddress: any;
    account?: string;
    localProvider: any;
    mainnetProvider?: any;
    injectedProvider: any;
    setInjectedProvider: any;
    pollTime?: number;
    price: number;
    minimized?: boolean;
}

const Account = ({address, setAddress, account, localProvider, mainnetProvider, injectedProvider, setInjectedProvider, pollTime, price, minimized = false}: AccountProps) => {

    const createBurnerIfNoAddress = () => {
        if (!injectedProvider && localProvider && typeof setInjectedProvider == "function") {
            if (localProvider.connection && localProvider.connection.url) {
                setInjectedProvider(new ethers.providers.Web3Provider(new BurnerProvider(localProvider.connection.url)));
                console.log("________BY URL", localProvider.connection.url)
            } else if (localProvider._network && localProvider._network.name) {
                setInjectedProvider(new ethers.providers.Web3Provider(new BurnerProvider("https://" + localProvider._network.name + ".infura.io/v3/" + INFURA_ID)));
                console.log("________INFURA")
            } else {
                console.log("________MAIN");
                setInjectedProvider(new ethers.providers.Web3Provider(new BurnerProvider("https://mainnet.infura.io/v3/" + INFURA_ID)))
            }
        } else {
            pollInjectedProvider().then();
        }
    };

    useEffect(createBurnerIfNoAddress, [injectedProvider]);

    const pollInjectedProvider = async () => {
        if (injectedProvider) {
            let accounts = await injectedProvider.listAccounts();
            if (accounts && accounts[0] && accounts[0] !== account) {
                if (typeof setAddress === "function") {
                    setAddress(accounts[0])
                }
            }
        }
    };

    usePoller(() => {
        pollInjectedProvider().then();
    }, pollTime ? pollTime : 1999);

    const loadWeb3Modal = async () => {
        const provider = await web3Modal.connect();
        if (typeof setInjectedProvider === "function") {
            setInjectedProvider(new ethers.providers.Web3Provider(provider));
        }
        await pollInjectedProvider()
    };

    const logoutOfWeb3Modal = async () => {
        await web3Modal.clearCachedProvider();
        //console.log("Cleared cache provider!?!",clear)
        setTimeout(() => {
            window.location.reload()
        }, 1)
    };

    let modalButtons = [];
    if (typeof setInjectedProvider === "function") {
        if (web3Modal.cachedProvider) {
            modalButtons.push(
                <Button key="logoutbutton" variant="outline-primary" onClick={logoutOfWeb3Modal}>logout</Button>
            )
        } else {
            modalButtons.push(
                <Button key="loginbutton" variant="primary" onClick={loadWeb3Modal}>connect</Button>
            )
        }
    }


    React.useEffect(() => {
        if (web3Modal.cachedProvider) {
            loadWeb3Modal().then();
        }
    }, []);

    let display = undefined;
    if (!minimized) {
        display = (
            <Navbar.Text>
                {address ? (
                    <Address value={address} ensProvider={mainnetProvider}/>
                ) : "Connecting..."}
                <Balance address={address} provider={localProvider} dollarMultiplier={price}/>
            </Navbar.Text>
        )
    }

    return (
        <div>
            {display}
            {modalButtons}
        </div>
    );
};

export default Account;