import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { getSignedKey } from '../../../../utils/KeyGenerator';
import { keccak256 } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { DisputeData, OrderData } from '../OrderElement';

type Props = {
    orderId: number;
    orderData: OrderData;
    disputeData: DisputeData;
    userProvider: any;
};

const ValidateDispute = (props: Props) => {
    const [canValidate, setCanValidate] = useState(false);
    const address = useSelector(getUserAddress);

    useEffect(() => {
        if (props.orderData.orderStage === 6) {
            setCanValidate(
                (address === props.orderData.buyer && !props.disputeData.buyerAcceptEscrow) ||
                    (address === props.orderData.seller && !props.disputeData.sellerAcceptEscrow) ||
                    (address === props.orderData.deliver && !props.disputeData.deliverAcceptEscrow),
            );
        }
    }, [props.orderData, props.disputeData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.acceptDisputeProposal(props.orderId).then(
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
            {canValidate && (
                <Button onClick={handleClick} variant="primary">
                    VALIDATE DISPUTE PROPOSAL
                </Button>
            )}
        </React.Fragment>
    );
};

export default ValidateDispute;
