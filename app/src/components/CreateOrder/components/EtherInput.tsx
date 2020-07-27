import React, {useEffect, useState} from 'react';
import {Col, Form, InputGroup, Row} from 'react-bootstrap';
import {IoIosSwap} from "react-icons/io";

type EtherInputProps = {
    currencyPrice: number
    label: string
    onChangeMode?: (mode: Mode) => void
    fullDisabled?: boolean
    ethBaseValue?: number
    setFieldValue: any
    name: string
    touched: any
    errors: any
}

export enum Mode {
    USD = "USD",
    ETH = "ETH"
}

const EtherInput = (props: EtherInputProps) => {
    const [mode, setMode] = useState(Mode.USD);
    const [ethValue, setEthValue] = useState(0);
    const [usdValue, setUsdValue] = useState(0);
    const regex = RegExp('^[0-9]*([,.][0-9]*)?$');

    useEffect(() => {
        if (props.ethBaseValue !== undefined) {
            setEthValue(props.ethBaseValue);
            setUsdValue(props.ethBaseValue * props.currencyPrice);
        }
    }, [props.ethBaseValue]);

    const handleChange = (event: any) => {
        let newValue = (event.target.value);
        if (newValue === undefined || newValue < 0) {
            newValue = 0;
        }
        if (mode === Mode.USD) {
            let ethValue = 0;
            if (newValue > 0) {
                ethValue = parseFloat(newValue) / props.currencyPrice;
            }
            setEthValue(ethValue);
            setUsdValue(newValue);
            props.setFieldValue(props.name, ethValue);
        } else {
            setEthValue(newValue);
            let usd = 0;
            if (newValue > 0) {
                usd = parseFloat(newValue) * props.currencyPrice;
            }
            setUsdValue(usd);
            props.setFieldValue(props.name, parseFloat(newValue));
        }
    };

    return (
        <Form.Group as={Row}>
            <Col sm={2}>
                <Form.Label>
                    {props.label}
                </Form.Label>
            </Col>
            <Col sm={4}>
                <InputGroup>
                    <Form.Control
                        isInvalid={mode === Mode.USD ? !regex.test(usdValue.toString()) : !regex.test(ethValue.toString())}
                        type="text"
                        value={mode === Mode.USD ? usdValue : ethValue}
                        onChange={handleChange}
                        disabled={props.fullDisabled}
                    />
                    <InputGroup.Append>
                        <InputGroup.Text id="symbol">{mode}</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Col>
            <Col>
                <Form.Text>
                    <div style={{cursor: "pointer"}} onClick={() => {
                        if (mode === Mode.USD) {
                            setMode(Mode.ETH);
                            if (props.onChangeMode) {
                                props.onChangeMode(Mode.ETH);
                            }
                        } else {
                            setMode(Mode.USD);
                            if (props.onChangeMode) {
                                props.onChangeMode(Mode.USD);
                            }
                        }
                    }}>
                        <IoIosSwap size={22}/>
                    </div>
                </Form.Text>
            </Col>
            <Col sm={4}>
                <InputGroup>
                    <Form.Control
                        type="text"
                        value={mode === Mode.USD ? ethValue : usdValue}
                        disabled={true}
                    />
                    <InputGroup.Append>
                        <InputGroup.Text id="symbol">{mode === Mode.USD ? Mode.ETH : Mode.USD}</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Col>
        </Form.Group>
    )
};

export default EtherInput;