import React, {useState} from 'react';
import {Col, Form, InputGroup, Row} from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import {Mode} from "./EtherInput";

type SellerDeliveryPayProps = {
    deliveryCost: number
    onChange: (pay: number) => void
    currencyMode: Mode
    currencyPrice: number
}

const SellerDeliveryPay = ({deliveryCost, onChange, currencyMode, currencyPrice}: SellerDeliveryPayProps) => {

    const [pay, setPay] = useState(0);
    const [checked, setChecked] = useState(false);

    let usdValue = currencyPrice * pay * deliveryCost / 100;
    let ethValue = pay * deliveryCost / 100;

    const handleCheck = (event: any) => {
        setChecked(event.target.checked);
        if (!event.target.checked) {
            setPay(0);
        }
    };

    const handleSellerPay = (event: any) => {
        setPay(Number(event.target.value));
        onChange(Number(event.target.value));
    };

    return (
        <Form.Group as={Row}>
            <Col xs={5}>
                <Form.Check
                    type="switch"
                    id="custom-switch"
                    label="Seller participate for the delivery ?"
                    onChange={handleCheck}
                />
            </Col>
            {
                checked ? (
                    <Form.Group as={Row}>
                        <Col xs="6">
                            <RangeSlider
                                value={pay}
                                onChange={handleSellerPay}
                                max={100}
                                min={0}
                                tooltipLabel={(currentValue: any) => `${currentValue}%`}
                            />
                        </Col>
                        <Col xs="6">
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    value={currencyMode === Mode.USD ? usdValue : ethValue}
                                    disabled={true}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text id="symbol">{currencyMode}</InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                    </Form.Group>
                ) : (
                    ""
                )
            }
        </Form.Group>
    )
};

export default SellerDeliveryPay;