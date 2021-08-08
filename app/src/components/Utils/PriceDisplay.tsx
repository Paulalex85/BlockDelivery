import React, { useEffect, useState } from 'react';
import { FaEthereum } from 'react-icons/fa';
import { BiDollar } from 'react-icons/bi';
import { BigNumber } from 'ethers';
import { formatEther } from '@ethersproject/units';

type Props = {
    weiAmount: BigNumber;
    dollarMultiplier?: number;
};

const PriceDisplay = ({ weiAmount, dollarMultiplier }: Props) => {
    const [dollarMode, setDollarMode] = useState(false);
    const [display, setDisplay] = useState('');

    useEffect(() => {
        if (dollarMode && dollarMultiplier) {
            setDisplay(Number(formatEther(weiAmount.mul(dollarMultiplier))).toFixed(2));
        } else {
            setDisplay(formatEther(weiAmount));
        }
    }, [dollarMode, weiAmount, dollarMultiplier]);

    return (
        <span
            onClick={() => {
                setDollarMode(!dollarMode);
            }}
        >
            {dollarMode ? <BiDollar /> : <FaEthereum />}
            {display}
        </span>
    );
};

export default PriceDisplay;
