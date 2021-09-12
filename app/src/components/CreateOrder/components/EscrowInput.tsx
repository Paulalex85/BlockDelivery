import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { EtherInput } from './';
import { BigNumber } from 'ethers';

type EscrowInputProps = {
    simpleEscrowValue: string;
    currencyPrice: number;
    setFieldValue: any;
    errors: any;
    initialValue: any;
};

enum EscrowType {
    Simple,
    Double,
    Custom,
}

const EscrowInput = (props: EscrowInputProps) => {
    const [buyerEscrow, setBuyerEscrow] = useState(BigNumber.from(0));
    const [sellerEscrow, setSellerEscrow] = useState(BigNumber.from(0));
    const [deliverEscrow, setDeliverEscrow] = useState(BigNumber.from(0));
    const [checked, setChecked] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(true);
    const [escrowType, setEscrowType] = useState(EscrowType.Simple);

    const handleCheck = (event: any) => {
        setChecked(event.target.checked);
        if (!event.target.checked) {
            initializeFields();
        } else {
            setEscrowType(EscrowType.Simple);
            setSimpleEscrow();
        }
    };

    function initializeFields() {
        props.setFieldValue('buyerEscrow', BigNumber.from(0));
        props.setFieldValue('sellerEscrow', BigNumber.from(0));
        props.setFieldValue('deliverEscrow', BigNumber.from(0));
        setBuyerEscrow(BigNumber.from(0));
        setDeliverEscrow(BigNumber.from(0));
        setSellerEscrow(BigNumber.from(0));
    }

    function setSimpleEscrow() {
        setBuyerEscrow(BigNumber.from(0));
        setDeliverEscrow(BigNumber.from(props.simpleEscrowValue));
        setSellerEscrow(BigNumber.from(props.simpleEscrowValue));
    }

    function setDoubleEscrow() {
        setBuyerEscrow(BigNumber.from(props.simpleEscrowValue));
        setDeliverEscrow(BigNumber.from(props.simpleEscrowValue).mul(2));
        setSellerEscrow(BigNumber.from(props.simpleEscrowValue).mul(2));
    }

    function setCustomEscrow() {
        setBuyerEscrow(BigNumber.from(-1));
        setDeliverEscrow(BigNumber.from(-1));
        setSellerEscrow(BigNumber.from(-1));
    }

    useEffect(() => {
        if (escrowType === EscrowType.Simple) {
            setSimpleEscrow();
        } else if (escrowType === EscrowType.Double) {
            setDoubleEscrow();
        }
    }, [props.simpleEscrowValue]);

    useEffect(() => {
        if (props.initialValue !== undefined) {
            setChecked(true);
            setEscrowType(EscrowType.Custom);
            setBuyerEscrow(props.initialValue.escrowBuyer);
            setSellerEscrow(props.initialValue.escrowSeller);
            setDeliverEscrow(props.initialValue.escrowDeliver);
        } else {
            initializeFields();
        }
    }, [props.initialValue]);

    const handleSelectInput = (event: any) => {
        setEscrowType(event.target.value);
        const parsedType: EscrowType = parseInt(event.target.value);
        switch (parsedType) {
            case EscrowType.Simple:
                setSimpleEscrow();
                setInputDisabled(true);
                break;
            case EscrowType.Double:
                setDoubleEscrow();
                setInputDisabled(true);
                break;
            case EscrowType.Custom:
                setCustomEscrow();
                setInputDisabled(false);
                break;
            default:
                console.error("can't parse " + event.target.value);
        }
    };

    return (
        <Form.Group as={Row}>
            <Col xs={5}>
                <Form.Check
                    checked={checked}
                    type="switch"
                    id="escrow-switch"
                    label="Escrow ?"
                    onChange={handleCheck}
                />
            </Col>
            {checked ? (
                <div>
                    <Form.Group>
                        <Form.Label>Escrow Type</Form.Label>
                        <Form.Control as="select" value={escrowType} onChange={handleSelectInput}>
                            <option value={EscrowType.Simple}>Simple</option>
                            <option value={EscrowType.Double}>Double</option>
                            <option value={EscrowType.Custom}>Custom</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <EtherInput
                            ethBaseValue={buyerEscrow.toString()}
                            fullDisabled={inputDisabled}
                            currencyPrice={props.currencyPrice}
                            label={'Buyer'}
                            setFieldValue={props.setFieldValue}
                            name={'buyerEscrow'}
                            errors={props.errors}
                        />
                        <EtherInput
                            ethBaseValue={sellerEscrow.toString()}
                            fullDisabled={inputDisabled}
                            currencyPrice={props.currencyPrice}
                            label={'Seller'}
                            setFieldValue={props.setFieldValue}
                            name={'sellerEscrow'}
                            errors={props.errors}
                        />
                        <EtherInput
                            ethBaseValue={deliverEscrow.toString()}
                            fullDisabled={inputDisabled}
                            currencyPrice={props.currencyPrice}
                            label={'Deliver'}
                            setFieldValue={props.setFieldValue}
                            name={'deliverEscrow'}
                            errors={props.errors}
                        />
                    </Form.Group>
                </div>
            ) : (
                ''
            )}
        </Form.Group>
    );
};

export default EscrowInput;
