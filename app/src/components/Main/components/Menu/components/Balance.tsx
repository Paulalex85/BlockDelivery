import React from 'react';
import { providers } from 'ethers';
import { Navbar } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../../redux/selectors';
import { PriceDisplay } from '../../../../Utils';
import { useBalance } from 'eth-hooks';

type Props = {
    provider: providers.Web3Provider;
};

const Balance = (props: Props) => {
    const address = useSelector(getUserAddress);
    const balance = useBalance(props.provider, address, 1999);

    return (
        <Navbar.Text style={{ paddingRight: 5 }}>
            <PriceDisplay weiAmount={balance} dollarMultiplier={1} />
        </Navbar.Text>
    );
};

export default Balance;
