import React, {useState} from 'react';
import {Col, Form, InputGroup, Row} from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import {Mode} from "./EtherInput";

type SellerDeliveryPayProps = {
    deliveryCost: number
    currencyMode: Mode
    currencyPrice: number
    setFieldValue: any
    name: string
}

const SellerDeliveryPay = (props: SellerDeliveryPayProps) => {

    const [pay, setPay] = useState(0);
    const [checked, setChecked] = useState(false);

    let usdValue = props.currencyPrice * pay * props.deliveryCost / 100;
    let ethValue = pay * props.deliveryCost / 100;

    const handleCheck = (event: any) => {
        setChecked(event.target.checked);
        if (!event.target.checked) {
            setPay(0);
        }
    };

    const handleSellerPay = (event: any) => {
        setPay(Number(event.target.value));
        console.log(Number(event.target.value));
        props.setFieldValue(props.name, Number(event.target.value) * props.deliveryCost / 100);
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
                                    value={props.currencyMode === Mode.USD ? usdValue : ethValue}
                                    disabled={true}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text id="symbol">{props.currencyMode}</InputGroup.Text>
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