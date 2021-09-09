import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { OrderData } from '../OrderElement';

type Props = {
    orderId: number;
    orderData: OrderData;
    userProvider: any;
};

const RevertDispute = (props: Props) => {
    const [canRevert, setCanRevert] = useState(false);
    const address = useSelector(getUserAddress);

    useEffect(() => {
        if (props.orderData.orderStage === 6) {
            setCanRevert(
                address === props.orderData.seller ||
                    address === props.orderData.deliver ||
                    address === props.orderData.buyer,
            );
        }
    }, [props.orderData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.revertDispute(props.orderId).then(
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
            {canRevert && (
                <React.Fragment>
                    <Button onClick={handleClick} variant="danger">
                        REVERT DISPUTE
                    </Button>
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default RevertDispute;
