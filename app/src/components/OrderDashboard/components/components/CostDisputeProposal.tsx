import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUserAddress, getWithdrawBalance } from '../../../../redux/selectors';
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import { bigFromEther, bigToEther, negativePriceRegex } from '../../../../utils/NumberUtils';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { formatEther } from '@ethersproject/units';
import { DisputeData, EscrowData, OrderData } from '../OrderElement';
import Big from 'big.js';
import { FaEthereum } from 'react-icons/fa';
import { BigNumber } from 'ethers';

type Props = {
    orderId: number;
    orderData: OrderData;
    escrowData: EscrowData;
    disputeData: DisputeData;
    userProvider: any;
};

const CostDisputeProposal = (props: Props) => {
    const [isActor, setIsActor] = useState(false);
    const [ethValue, setEthValue] = useState('0');
    const [bigEthValue, setBigEthValue] = useState(Big(0));
    const [sellerIncome, setSellerIncome] = useState(Big(0));
    const [sellerBalance, setSellerBalance] = useState(Big(0));
    const [deliverIncome, setDeliverIncome] = useState(Big(0));
    const [deliverBalance, setDeliverBalance] = useState(Big(0));
    const [nextBalanceUser, setNextBalanceUser] = useState(Big(0));
    const address: string = useSelector(getUserAddress);
    const withdrawBalance: BigNumber = useSelector(getWithdrawBalance);

    useEffect(() => {
        if (
            props.orderData.orderStage === 7 &&
            (address === props.orderData.seller || address === props.orderData.deliver)
        ) {
            setIsActor(true);
        }
    }, [props.orderData]);

    useEffect(() => {
        if (props.disputeData !== undefined && props.disputeData.sellerBalance !== undefined) {
            setEthValue(formatEther(props.disputeData.sellerBalance));
        }
    }, [props.disputeData]);

    useEffect(() => {
        try {
            const newBigValue = Big(ethValue);
            setBigEthValue(newBigValue);
        } catch (e) {
            setBigEthValue(Big(0));
        }
    }, [ethValue]);

    useEffect(() => {
        try {
            setSellerIncome(
                Big(props.orderData.sellerPrice.toString())
                    .add(props.escrowData.escrowSeller.toString())
                    .sub(props.disputeData.buyerReceive.div(2).toString())
                    .add(bigFromEther(bigEthValue)),
            );
        } catch (e) {
            setSellerIncome(Big(0));
        }
    }, [props.orderData.sellerPrice, props.escrowData.escrowSeller, props.disputeData.buyerReceive, bigEthValue]);

    useEffect(() => {
        try {
            setDeliverIncome(
                Big(props.orderData.deliverPrice.toString())
                    .add(props.escrowData.escrowDeliver.toString())
                    .sub(props.disputeData.buyerReceive.div(2).toString())
                    .add(bigFromEther(bigEthValue.mul(-1))),
            );
        } catch (e) {
            setDeliverIncome(Big(0));
        }
    }, [props.orderData.deliverPrice, props.escrowData.escrowDeliver, props.disputeData.buyerReceive, bigEthValue]);

    useEffect(() => {
        try {
            setSellerBalance(
                sellerIncome
                    .sub(props.escrowData.escrowSeller.toString())
                    .sub(props.orderData.sellerDeliveryPay.toString()),
            );
        } catch (e) {
            setSellerBalance(Big(0));
        }
    }, [sellerIncome, props.orderData.sellerDeliveryPay]);

    useEffect(() => {
        try {
            setDeliverBalance(deliverIncome.sub(props.escrowData.escrowDeliver.toString()));
        } catch (e) {
            setDeliverBalance(Big(0));
        }
    }, [deliverIncome]);

    useEffect(() => {
        if (address === props.orderData.seller) {
            setNextBalanceUser(sellerIncome.add(withdrawBalance.toString()));
        } else if (address === props.orderData.deliver) {
            setNextBalanceUser(deliverIncome.add(withdrawBalance.toString()));
        }
    }, [sellerIncome, deliverIncome]);

    const handleChange = (event: any) => {
        setEthValue(event.target.value);
    };

    const handleSubmit = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner
                .costDisputeProposal(props.orderId, bigFromEther(bigEthValue).toString(), {
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
            {props.orderData.orderStage === 7 && (
                <React.Fragment>
                    <h5>Cost proposal overview</h5>
                    <span>
                        Buyer receive : <FaEthereum />
                        {formatEther(props.disputeData.buyerReceive)}
                    </span>
                    <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>User Paid</th>
                                <th>Buyer receive repartition</th>
                                <th>Cost repartition</th>
                                <th>Income</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Seller</td>
                                <td>
                                    {formatEther(props.escrowData.escrowSeller.add(props.orderData.sellerDeliveryPay))}
                                </td>
                                <td>{formatEther(props.disputeData.buyerReceive.div(2))}</td>
                                <td>{bigEthValue.toString()}</td>
                                <td>{bigToEther(sellerIncome).toString()}</td>
                                <td>{bigToEther(sellerBalance).toString()}</td>
                            </tr>
                            <tr>
                                <td>Deliver</td>
                                <td>{formatEther(props.escrowData.escrowDeliver)}</td>
                                <td>{formatEther(props.disputeData.buyerReceive.div(2))}</td>
                                <td>{-bigEthValue.toString()}</td>
                                <td>{bigToEther(deliverIncome).toString()}</td>
                                <td>{bigToEther(deliverBalance).toString()}</td>
                            </tr>
                        </tbody>
                    </Table>
                </React.Fragment>
            )}
            {isActor && (
                <React.Fragment>
                    <InputGroup>
                        <Form.Control
                            isInvalid={!negativePriceRegex.test(ethValue)}
                            type="text"
                            value={ethValue}
                            onChange={handleChange}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text id="symbol">ETH</InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    <Button onClick={handleSubmit} variant="primary">
                        COST PROPOSAL
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

export default CostDisputeProposal;
