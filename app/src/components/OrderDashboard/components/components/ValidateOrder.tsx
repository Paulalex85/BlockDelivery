import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { getSignedKey } from '../../../../utils/KeyGenerator';
import { keccak256 } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

type Props = {
    orderId: number;
    orderData: any;
    escrowData: any;
    userProvider: any;
    setUserKey: any;
};

const ValidateOrder = (props: Props) => {
    const [canValidate, setCanValidate] = useState(false);
    const address = useSelector(getUserAddress);

    useEffect(() => {
        if (props.orderData.orderStage === 0) {
            setCanValidate(
                (address === props.orderData.buyer && !props.orderData.buyerValidation) ||
                    (address === props.orderData.seller && !props.orderData.sellerValidation) ||
                    (address === props.orderData.deliver && !props.orderData.deliverValidation),
            );
        }
    }, [props.orderData]);

    const getValueToPay = () => {
        if (address === props.orderData.buyer && !props.orderData.buyerValidation) {
            return props.orderData.deliverPrice
                .add(props.orderData.sellerPrice)
                .add(props.escrowData.escrowBuyer)
                .sub(props.orderData.sellerDeliveryPay);
        } else if (address === props.orderData.seller && !props.orderData.sellerValidation) {
            return props.escrowData.escrowSeller.add(props.orderData.sellerDeliveryPay);
        } else if (address === props.orderData.deliver && !props.orderData.deliverValidation) {
            return props.escrowData.escrowDeliver;
        }
        return BigNumber.from(0);
    };

    const handleClick = () => {
        getSignedKey(props.orderId, props.orderData, props.escrowData, props.userProvider, address).then(
            (signedKey) => {
                createEthersContract(props.userProvider).then((contract) => {
                    const contractWithSigner = contract.connect(props.userProvider.getSigner());
                    if (signedKey !== '') {
                        const hash = keccak256(signedKey);
                        contractWithSigner.validateOrder(props.orderId, hash, { value: getValueToPay() }).then(
                            (tx: any) => {
                                props.setUserKey(signedKey);
                                console.log(tx);
                            },
                            (e: any) => {
                                console.log('Unable to send the transaction', e);
                            },
                        );
                    }
                });
            },
        );
    };

    return (
        <React.Fragment>
            {canValidate && (
                <Button onClick={handleClick} variant="primary">
                    VALIDATE
                </Button>
            )}
        </React.Fragment>
    );
};

export default ValidateOrder;
