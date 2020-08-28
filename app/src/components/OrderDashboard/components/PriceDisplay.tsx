import React, {useEffect, useState} from 'react'
import {FaEthereum} from "react-icons/fa";

type Props = {
    ethAmount: number;
    dollarMultiplier: number;
}

const PriceDisplay = ({ethAmount, dollarMultiplier}: Props) => {
    const [dollarMode, setDollarMode] = useState(false);
    const [display, setDisplay] = useState("");

    useEffect(() => {
        if (dollarMode) {
            setDisplay("$" + (ethAmount * dollarMultiplier).toFixed(2));
        } else {
            setDisplay(ethAmount.toFixed(4));
        }
    }, [dollarMode, ethAmount, dollarMultiplier]);

    return (
        <span onClick={() => {
            setDollarMode(!dollarMode)
        }}>
            {
                dollarMode ? "" : <FaEthereum/>
            }
            {display}
        </span>
    );
};

export default PriceDisplay;