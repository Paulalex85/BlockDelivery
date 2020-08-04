import React, {useEffect, useState} from 'react';
import {Col, Form, Row} from 'react-bootstrap';
import {EtherInput} from "./";

type EscrowInputProps = {
    simpleEscrowValue: number
    currencyPrice: number
    setFieldValue: any
    errors: any
}

const EscrowInput = (props: EscrowInputProps) => {

    const [buyerEscrow, setBuyerEscrow] = useState(0);
    const [sellerEscrow, setSellerEscrow] = useState(0);
    const [deliverEscrow, setDeliverEscrow] = useState(0);
    const [checked, setChecked] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(true);
    const [escrowType, setEscrowType] = useState("simple");

    const handleCheck = (event: any) => {
        setChecked(event.target.checked);
        if (!event.target.checked) {
            props.setFieldValue("buyerEscrow", 0);
            props.setFieldValue("sellerEscrow", 0);
            props.setFieldValue("deliverEscrow", 0);
            setBuyerEscrow(0);
            setDeliverEscrow(0);
            setSellerEscrow(0);
        } else {
            setEscrowType("simple");
            setSimpleEscrow();
        }
    };

    function setSimpleEscrow() {
        setBuyerEscrow(0);
        setDeliverEscrow(props.simpleEscrowValue);
        setSellerEscrow(props.simpleEscrowValue);
    }

    function setDoubleEscrow() {
        setBuyerEscrow(props.simpleEscrowValue);
        setDeliverEscrow(props.simpleEscrowValue * 2);
        setSellerEscrow(props.simpleEscrowValue * 2);
    }

    function setCustomEscrow() {
        setBuyerEscrow(-1);
        setDeliverEscrow(-1);
        setSellerEscrow(-1);
    }

    useEffect(() => {
        if (escrowType === "simple") {
            setSimpleEscrow();
        } else if (escrowType === "double") {
            setDoubleEscrow();
        }
    }, [props.simpleEscrowValue]);

    const handleSelectInput = (event: any) => {
        setEscrowType(event.target.value);
        switch (event.target.value) {
            case "simple":
                setSimpleEscrow();
                setInputDisabled(true);
                break;
            case "double":
                setDoubleEscrow();
                setInputDisabled(true);
                break;
            case "custom":
                setCustomEscrow();
                setInputDisabled(false);
                break;
        }
    };

    return (
        <Form.Group as={Row}>
            <Col xs={5}>
                <Form.Check
                    type="switch"
                    id="escrow-switch"
                    label="Escrow ?"
                    onChange={handleCheck}
                />
            </Col>
            {
                checked ? (
                    <div>
                        <Form.Group>
                            <Form.Label>Escrow Type</Form.Label>
                            <Form.Control as="select" onChange={handleSelectInput}>
                                <option value={"simple"}>Simple</option>
                                <option value={"double"}>Double</option>
                                <option value={"custom"}>Custom</option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group>
                            <EtherInput
                                ethBaseValue={buyerEscrow}
                                fullDisabled={inputDisabled}
                                currencyPrice={props.currencyPrice}
                                label={"Buyer"}
                                setFieldValue={props.setFieldValue}
                                name={"buyerEscrow"}
                                errors={props.errors}
                            />
                            <EtherInput
                                ethBaseValue={sellerEscrow}
                                fullDisabled={inputDisabled}
                                currencyPrice={props.currencyPrice}
                                label={"Seller"}
                                setFieldValue={props.setFieldValue}
                                name={"sellerEscrow"}
                                errors={props.errors}
                            />
                            <EtherInput
                                ethBaseValue={deliverEscrow}
                                fullDisabled={inputDisabled}
                                currencyPrice={props.currencyPrice}
                                label={"Deliver"}
                                setFieldValue={props.setFieldValue}
                                name={"deliverEscrow"}
                                errors={props.errors}
                            />
                        </Form.Group>
                    </div>
                ) : (
                    ""
                )
            }
        </Form.Group>
    )
};

export default EscrowInput;