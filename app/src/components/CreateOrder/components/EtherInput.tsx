import React, {useEffect, useState} from 'react';
import {Col, Form, InputGroup, Row} from 'react-bootstrap';
import {IoIosSwap} from "react-icons/io";

type EtherInputProps = {
    currencyPrice: number
    label: string
    onChange: (ethValue: number) => void
    onChangeMode?: (mode: Mode) => void
    fullDisabled?: boolean
    ethBaseValue?: number
}

export enum Mode {
    USD = "USD",
    ETH = "ETH"
}

const EtherInput = ({currencyPrice, label, onChange, onChangeMode, fullDisabled, ethBaseValue}: EtherInputProps) => {
    const [mode, setMode] = useState(Mode.USD);
    const [ethValue, setEthValue] = useState(0);
    const [usdValue, setUsdValue] = useState(0);
    const regex = RegExp('^[0-9]*([,.][0-9]*)?$');

    useEffect(() => {
        if (ethBaseValue !== undefined) {
            setEthValue(ethBaseValue);
            setUsdValue(ethBaseValue * currencyPrice);
        }
    }, [ethBaseValue]);

    const handleChange = (event: any) => {
        let newValue = (event.target.value);
        if (newValue === undefined || newValue < 0) {
            newValue = 0;
        }
        if (mode === Mode.USD) {
            let ethValue = 0;
            if (newValue > 0) {
                ethValue = parseFloat(newValue) / currencyPrice;
            }
            setEthValue(ethValue);
            setUsdValue(newValue);
            onChange(ethValue);
        } else {
            setEthValue(newValue);
            let usd = 0;
            if (newValue > 0) {
                usd = parseFloat(newValue) * currencyPrice;
            }
            setUsdValue(usd);
            onChange(parseFloat(newValue));
        }
    };

    return (
        <Form.Group as={Row}>
            <Col sm={2}>
                <Form.Label>
                    {label}
                </Form.Label>
            </Col>
            <Col sm={4}>
                <InputGroup>
                    <Form.Control
                        isInvalid={mode === Mode.USD ? !regex.test(usdValue.toString()) : !regex.test(ethValue.toString())}
                        type="text"
                        value={mode === Mode.USD ? usdValue : ethValue}
                        onChange={handleChange}
                        disabled={fullDisabled}
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
                            if (onChangeMode) {
                                onChangeMode(Mode.ETH);
                            }
                        } else {
                            setMode(Mode.USD);
                            if (onChangeMode) {
                                onChangeMode(Mode.USD);
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