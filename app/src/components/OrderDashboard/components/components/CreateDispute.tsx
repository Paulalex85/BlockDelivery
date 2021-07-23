import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { priceRegex } from '../../../../utils/NumberUtils';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { BigNumber } from 'ethers';
import { formatEther, parseEther } from '@ethersproject/units';
import { FaEthereum } from 'react-icons/fa';

type Props = {
    orderId: number;
    orderData: any;
    userProvider: any;
};

const CreateDispute = (props: Props) => {
    const [canCreate, setCanCreate] = useState(false);
    const [disabledButton, setDisabledButton] = useState(false);
    const [ethValue, setEthValue] = useState('0');
    const address = useSelector(getUserAddress);
    const [maxBuyerReceive, setMaxBuyerReceive] = useState(BigNumber.from(0));

    useEffect(() => {
        if (
            (props.orderData.orderStage === 1 || props.orderData.orderStage === 2) &&
            (address === props.orderData.buyer ||
                address === props.orderData.seller ||
                address === props.orderData.deliver)
        ) {
            setCanCreate(true);
        }
        setMaxBuyerReceive(
            props.orderData.deliverPrice.add(props.orderData.sellerPrice).sub(props.orderData.sellerDeliveryPay),
        );
    }, [props.orderData]);

    useEffect(() => {
        try {
            setDisabledButton(BigNumber.from(parseEther(ethValue)).gt(maxBuyerReceive));
        } catch (e) {
            setDisabledButton(true);
        }
    }, [ethValue, maxBuyerReceive]);

    const handleChange = (event: any) => {
        const newValue = event.target.value;
        if (newValue === undefined || newValue < 0) {
            setEthValue('0');
        } else {
            setEthValue(newValue);
        }
    };

    const handleSubmit = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.createDispute(props.orderId, BigNumber.from(parseEther(ethValue))).then(
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
            {canCreate && (
                <React.Fragment>
                    <InputGroup>
                        <Form.Control
                            isInvalid={!priceRegex.test(ethValue)}
                            type="text"
                            value={ethValue}
                            onChange={handleChange}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text id="symbol">ETH</InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    <Button onClick={handleSubmit} disabled={disabledButton} variant="primary">
                        CREATE DISPUTE
                    </Button>
                    Should be less than {formatEther(maxBuyerReceive)}
                    <FaEthereum />
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default CreateDispute;
