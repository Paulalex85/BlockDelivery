import React, {useState} from 'react'
import * as ethers from "ethers";
import {usePoller} from "../../../../../hooks";
import {Navbar} from 'react-bootstrap'
import {FaEthereum} from "react-icons/fa";
import {useSelector} from "react-redux";
import {getUserAddress} from "../../../../../redux/selectors";

type BalanceProps = {
    balanceProps?: string;
    pollTime?: number;
    dollarMultiplier?: number;
    provider: any;
}

const Balance = ({balanceProps, pollTime, dollarMultiplier, provider}: BalanceProps) => {

    const [dollarMode, setDollarMode] = useState(false);
    const [balance, setBalance] = useState("");
    let address = useSelector(getUserAddress);

    usePoller(async () => {
        if (address && provider) {
            try {
                const newBalance = await provider.getBalance(address);
                setBalance(newBalance)
            } catch (e) {
                console.log(e)
            }
        }
    }, pollTime ? pollTime : 1999);

    let floatBalance = parseFloat("0.00");

    let usingBalance = balance;

    if (typeof balanceProps != "undefined") {
        usingBalance = balanceProps
    }

    if (usingBalance) {
        let etherBalance = ethers.utils.formatEther(usingBalance);
        parseFloat(etherBalance).toFixed(2);
        floatBalance = parseFloat(etherBalance)
    }

    let displayBalance = floatBalance.toFixed(4);

    if (dollarMultiplier && dollarMode) {
        displayBalance = "$" + (floatBalance * dollarMultiplier).toFixed(2)
    }

    return (
        <Navbar.Text style={{paddingRight: 5}} onClick={() => {
            setDollarMode(!dollarMode)
        }}>
            {
                dollarMode ? "" : <FaEthereum/>
            }
            {displayBalance}
        </Navbar.Text>
    );
};

export default Balance;