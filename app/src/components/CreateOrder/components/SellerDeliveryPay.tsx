import React, {useState} from 'react';
import {Col, Form, InputGroup, Row} from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import {Mode} from "./EtherInput";
import {BigNumber} from "ethers";
import {formatEther, parseUnits} from "ethers/lib/utils";

type SellerDeliveryPayProps = {
    deliveryCost: BigNumber
    currencyMode: Mode
    currencyPrice: number
    setFieldValue: any
    name: string
}

const SellerDeliveryPay = (props: SellerDeliveryPayProps) => {

    const [pay, setPay] = useState(BigNumber.from(0));
    const [checked, setChecked] = useState(false);

    let currencyPriceBN = parseUnits(props.currencyPrice.toString(), 2);
    let usdValue = formatEther(BigNumber.from(pay).mul(currencyPriceBN).mul(props.deliveryCost).div(10000));
    let ethValue = pay.mul(props.deliveryCost).div(100);

    const handleCheck = (event: any) => {
        setChecked(event.target.checked);
        if (!event.target.checked) {
            setPay(BigNumber.from(0));
        }
    };

    const handleSellerPay = (event: any) => {
        setPay(BigNumber.from(event.target.value));
        props.setFieldValue(props.name, BigNumber.from(event.target.value).mul(props.deliveryCost).div(100));
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
                                    value={props.currencyMode === Mode.USD ? usdValue : formatEther(ethValue)}
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