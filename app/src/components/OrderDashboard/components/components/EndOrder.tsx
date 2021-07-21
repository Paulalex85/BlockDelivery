import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';

type Props = {
    orderId: number;
    orderData: any;
    userProvider: any;
};

const EndOrder = (props: Props) => {
    const [canEndOrder, setCanEndOrder] = useState(false);
    const address = useSelector(getUserAddress);

    useEffect(() => {
        setCanEndOrder(props.orderData.orderStage === 3 && address === props.orderData.buyer);
    }, [props.orderData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.endOrder(props.orderId).then(
                (tx: any) => {
                    console.log(tx);
                },
                (e: any) => {
                    console.log('Unable to send the transaction', e);
                },
            );
        });
    };

    return (
        <React.Fragment>
            {canEndOrder && (
                <Button onClick={handleClick} variant="primary">
                    FINISH ORDER
                </Button>
            )}
        </React.Fragment>
    );
};

export default EndOrder;
