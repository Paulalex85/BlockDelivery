import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';

type Props = {
    orderData: any;
    orderId: number;
    userProvider: any;
};

const InitializeCancel = (props: Props) => {
    const [canCancel, setCanCancel] = useState(false);
    let address = useSelector(getUserAddress);

    useEffect(() => {
        if (
            props.orderData.orderStage === 0 &&
            (address === props.orderData.buyer ||
                address === props.orderData.seller ||
                address === props.orderData.deliver)
        ) {
            setCanCancel(true);
        }
    }, [props.orderData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            let contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.initializationCancel(props.orderId).then(
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
            {canCancel && (
                <Button onClick={handleClick} variant="danger" className="float-right">
                    INITIALIZATION CANCEL
                </Button>
            )}
        </React.Fragment>
    );
};

export default InitializeCancel;
