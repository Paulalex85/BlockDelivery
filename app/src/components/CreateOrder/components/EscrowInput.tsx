import React, {useEffect, useState} from 'react';
import {Col, Form, InputGroup, Row} from 'react-bootstrap';
import {EtherInput} from "./";

type EscrowInputProps = {
    simpleEscrowValue: number
    currencyPrice: number
    onChangeBuyer: (escrow: number) => void
    onChangeSeller: (escrow: number) => void
    onChangeDeliver: (escrow: number) => void
}

const EscrowInput = ({simpleEscrowValue, currencyPrice}: EscrowInputProps) => {

    const [buyerEscrow, setBuyerEscrow] = useState(0);
    const [sellerEscrow, setSellerEscrow] = useState(0);
    const [deliverEscrow, setDeliverEscrow] = useState(0);
    const [checked, setChecked] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(true);
    const [escrowType, setEscrowType] = useState("simple");

    const handleCheck = (event: any) => {
        setChecked(event.target.checked);
        if (!event.target.checked) {
            setBuyerEscrow(0);
            setDeliverEscrow(0);
            setSellerEscrow(0);
        }
    };

    useEffect(() => {
        if (escrowType === "simple") {
            setBuyerEscrow(0);
            setDeliverEscrow(simpleEscrowValue);
            setSellerEscrow(simpleEscrowValue);
        } else if (escrowType === "double") {
            setBuyerEscrow(simpleEscrowValue);
            setDeliverEscrow(simpleEscrowValue * 2);
            setSellerEscrow(simpleEscrowValue * 2);
        }
    }, [simpleEscrowValue]);

    const handleSelectInput = (event: any) => {
        setEscrowType(event.target.value);
        switch (event.target.value) {
            case "simple":
                setBuyerEscrow(0);
                setDeliverEscrow(simpleEscrowValue);
                setSellerEscrow(simpleEscrowValue);
                setInputDisabled(true);
                break;
            case "double":
                setBuyerEscrow(simpleEscrowValue);
                setDeliverEscrow(simpleEscrowValue * 2);
                setSellerEscrow(simpleEscrowValue * 2);
                setInputDisabled(true);
                break;
            case "custom":
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
                                currencyPrice={currencyPrice}
                                label={"Buyer"}
                                onChange={(value) => setBuyerEscrow(value)}/>
                            <EtherInput
                                ethBaseValue={sellerEscrow}
                                fullDisabled={inputDisabled}
                                currencyPrice={currencyPrice}
                                label={"Seller"}
                                onChange={(value) => setSellerEscrow(value)}/>
                            <EtherInput
                                ethBaseValue={deliverEscrow}
                                fullDisabled={inputDisabled}
                                currencyPrice={currencyPrice}
                                label={"Deliver"}
                                onChange={(value) => setDeliverEscrow(value)}/>
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