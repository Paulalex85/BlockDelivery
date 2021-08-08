import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import { bigFromEther, bigToEther, negativePriceRegex } from '../../../../utils/NumberUtils';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { formatEther } from '@ethersproject/units';
import { DisputeData, EscrowData, OrderData } from '../OrderElement';
import Big from 'big.js';
import { FaEthereum } from 'react-icons/fa';

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
    const address = useSelector(getUserAddress);

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
            setSellerIncome(
                Big(props.orderData.sellerPrice.toString())
                    .add(props.escrowData.escrowSeller.toString())
                    .sub(props.disputeData.buyerReceive.div(2).toString())
                    .add(bigFromEther(Big(ethValue))),
            );
        } catch (e) {
            setSellerIncome(Big(0));
        }
    }, [props.orderData.sellerPrice, props.escrowData.escrowSeller, props.disputeData.buyerReceive, ethValue]);

    useEffect(() => {
        try {
            setDeliverIncome(
                Big(props.orderData.deliverPrice.toString())
                    .add(props.escrowData.escrowDeliver.toString())
                    .sub(props.disputeData.buyerReceive.div(2).toString())
                    .add(bigFromEther(Big(-ethValue))),
            );
        } catch (e) {
            setDeliverIncome(Big(0));
        }
    }, [props.orderData.deliverPrice, props.escrowData.escrowDeliver, props.disputeData.buyerReceive, ethValue]);

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

    const handleChange = (event: any) => {
        setEthValue(event.target.value);
        try {
            const newBigValue = Big(event.target.value);
            setBigEthValue(newBigValue);
        } catch (e) {}
    };

    //todo handle when actor need to pay more
    const handleSubmit = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.costDisputeProposal(props.orderId, bigFromEther(bigEthValue).toString()).then(
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
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default CostDisputeProposal;
