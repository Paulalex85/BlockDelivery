import React, { useEffect, useState } from 'react';
import { Button, InputGroup, FormControl } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import { createEthersContract } from '../../../../utils/createEthersContract';
import { HashQRCodeReader } from './index';

type Props = {
    orderData: any;
    orderId: number;
    userProvider: any;
};

const ScanAction = (props: Props) => {
    const [isScanning, setIsScanning] = useState(false);
    const [isTakingOrder, setIsTakingOrder] = useState(false);
    const [key, setKey] = useState('');
    const address = useSelector(getUserAddress);

    useEffect(() => {
        if (props.orderData.orderStage === 1) {
            setIsTakingOrder(true);
        } else {
            setIsTakingOrder(false);
        }
        if (
            (props.orderData.orderStage === 1 || props.orderData.orderStage === 2) &&
            address === props.orderData.deliver
        ) {
            setIsScanning(true);
        }
    }, [props.orderData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            const contractWithSigner = contract.connect(props.userProvider.getSigner());
            if (isTakingOrder) {
                contractWithSigner.takeOrder(props.orderId, key).then(
                    (tx: any) => {
                        console.log(tx);
                    },
                    (e: any) => {
                        console.log('Unable to send the transaction', e);
                    },
                );
            } else {
                contractWithSigner.deliverOrder(props.orderId, key).then(
                    (tx: any) => {
                        console.log(tx);
                    },
                    (e: any) => {
                        console.log('Unable to send the transaction', e);
                    },
                );
            }
        });
    };

    const handleChange = (event: any) => {
        setKey(event.target.value);
    };

    return (
        <React.Fragment>
            {isScanning && (
                <React.Fragment>
                    <h5>Enter the code for validation or scan QR Code</h5>
                    <HashQRCodeReader onChange={(value) => setKey(value)} />
                    <InputGroup className="mb-3">
                        <InputGroup.Prepend>
                            <InputGroup.Text id="inputGroup-sizing-default">Key</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                            name="key"
                            value={key}
                            onChange={handleChange}
                            aria-label="Default"
                            aria-describedby="inputGroup-sizing-default"
                        />
                        <InputGroup.Append>
                            <Button onClick={handleClick} variant="primary">
                                {isTakingOrder ? 'ORDER TAKEN' : 'ORDER DELIVERED'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default ScanAction;
