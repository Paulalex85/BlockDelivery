import React, { useState } from 'react';
import * as ethers from 'ethers';
import { usePoller } from '../../../../../hooks';
import { Navbar } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../../redux/selectors';
import { PriceDisplay } from '../../../../Utils';
import { BigNumber } from 'ethers';

type Props = {
    balanceProps?: string;
    pollTime?: number;
    dollarMultiplier?: number;
    provider: any;
};

const Balance = ({ pollTime, dollarMultiplier, provider }: Props) => {
    const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0));
    let address = useSelector(getUserAddress);

    usePoller(
        async () => {
            if (address && provider) {
                try {
                    const newBalance = await provider.getBalance(address);
                    setBalance(BigNumber.from(newBalance));
                } catch (e) {
                    console.log(e);
                }
            }
        },
        pollTime ? pollTime : 1999,
    );

    return (
        <Navbar.Text style={{ paddingRight: 5 }}>
            <PriceDisplay weiAmount={balance} dollarMultiplier={dollarMultiplier} />
        </Navbar.Text>
    );
};

export default Balance;
