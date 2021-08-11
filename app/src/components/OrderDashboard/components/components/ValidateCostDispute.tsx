import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress, getWithdrawBalance } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { DisputeData, EscrowData, OrderData } from '../OrderElement';
import Big from 'big.js';
import { bigToEther } from '../../../../utils/NumberUtils';
import { BigNumber } from 'ethers';
import { FaEthereum } from 'react-icons/fa';

type Props = {
    orderId: number;
    orderData: OrderData;
    disputeData: DisputeData;
    escrowData: EscrowData;
    userProvider: any;
};

const ValidateCostDispute = (props: Props) => {
    const [canValidate, setCanValidate] = useState(false);
    const [nextBalanceUser, setNextBalanceUser] = useState(Big(0));
    const address = useSelector(getUserAddress);
    const withdrawBalance: BigNumber = useSelector(getWithdrawBalance);

    useEffect(() => {
        try {
            if (address === props.orderData.seller) {
                setNextBalanceUser(
                    Big(props.orderData.sellerPrice.toString())
                        .add(props.escrowData.escrowSeller.toString())
                        .sub(props.disputeData.buyerReceive.div(2).toString())
                        .add(props.disputeData.sellerBalance)
                        .add(withdrawBalance.toString()),
                );
            } else if (address === props.orderData.deliver) {
                setNextBalanceUser(
                    Big(props.orderData.deliverPrice.toString())
                        .add(props.escrowData.escrowDeliver.toString())
                        .sub(props.disputeData.buyerReceive.div(2).toString())
                        .add(-props.disputeData.sellerBalance)
                        .add(withdrawBalance.toString()),
                );
            }
        } catch (e) {
            setNextBalanceUser(Big(0));
        }
    }, [props.orderData, props.disputeData, props.escrowData, withdrawBalance]);

    useEffect(() => {
        if (props.orderData.orderStage === 7) {
            setCanValidate(
                (address === props.orderData.seller &&
                    !props.disputeData.sellerAcceptEscrow &&
                    props.disputeData.deliverAcceptEscrow) ||
                    (address === props.orderData.deliver &&
                        !props.disputeData.deliverAcceptEscrow &&
                        props.disputeData.sellerAcceptEscrow),
            );
        }
    }, [props.orderData, props.disputeData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner
                .acceptCostProposal(props.orderId, {
                    value: nextBalanceUser.lt(0) ? nextBalanceUser.abs().toString() : 0,
                })
                .then(
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
                <React.Fragment>
                    <Button onClick={handleClick} variant="primary">
                        VALIDATE COST DISPUTE PROPOSAL
                    </Button>
                    {nextBalanceUser.lt(0) ? (
                        <span>
                            Need to pay <FaEthereum /> {bigToEther(nextBalanceUser.abs()).toString()}
                        </span>
                    ) : (
                        <React.Fragment />
                    )}
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default ValidateCostDispute;
