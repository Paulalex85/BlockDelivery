import React, {useEffect, useState} from 'react';
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
    initialValue: string
}

const SellerDeliveryPay = (props: SellerDeliveryPayProps) => {

    const [pay, setPay] = useState(BigNumber.from(0));
    const [usdValue, setUsdValue] = useState("");
    const [ethValue, setEthValue] = useState(BigNumber.from(0));

    let currencyPriceBN = parseUnits(props.currencyPrice.toString(), 2);

    useEffect(() => {
        const bnInitialValue = BigNumber.from(props.initialValue);
        handleChange(bnInitialValue.mul(100).div(props.deliveryCost));
    }, [props.initialValue]);

    useEffect(() => {
        setUsdValue(formatEther(BigNumber.from(pay).mul(currencyPriceBN).mul(props.deliveryCost).div(10000)));
    }, [currencyPriceBN, pay, props.deliveryCost]);

    useEffect(() => {
        setEthValue(pay.mul(props.deliveryCost).div(100));
    }, [pay, props.deliveryCost]);

    const handleChange = (value: BigNumber) => {
        setPay(value);
        props.setFieldValue(props.name, value.mul(props.deliveryCost).div(100));
    };

    const handleSellerPay = (event: any) => {
        handleChange(BigNumber.from(event.target.value));
    };

    return (
        <Form.Group as={Row}>
            <Col xs="4">
                <Form.Label>
                    Seller participate for the delivery ?
                </Form.Label>
            </Col>
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

        </Form.Group>
    )
};

export default SellerDeliveryPay;