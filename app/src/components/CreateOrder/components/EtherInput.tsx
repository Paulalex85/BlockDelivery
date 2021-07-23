import React, { useEffect, useState } from 'react';
import { Col, Form, InputGroup, Row } from 'react-bootstrap';
import { IoIosSwap } from 'react-icons/io';
import { ErrorMessage } from 'formik';
import { BigNumber, ethers } from 'ethers';
import { formatEther, formatUnits, parseEther, parseUnits } from '@ethersproject/units';
import { priceRegex } from '../../../utils/NumberUtils';

type EtherInputProps = {
    currencyPrice: number;
    label: string;
    onChangeMode?: (mode: Mode) => void;
    fullDisabled?: boolean;
    ethBaseValue?: string;
    setFieldValue: any;
    name: string;
    errors: any;
};

export enum Mode {
    USD = 'USD',
    ETH = 'ETH',
}

const EtherInput = (props: EtherInputProps) => {
    const [mode, setMode] = useState(Mode.USD);
    const [ethValue, setEthValue] = useState('0');
    const [usdValue, setUsdValue] = useState('0');
    const currencyPriceBN = parseUnits(props.currencyPrice.toString(), 2);

    useEffect(() => {
        if (props.ethBaseValue !== undefined) {
            const baseValue = BigNumber.from(props.ethBaseValue);
            if (!baseValue.isNegative()) {
                setEthValue(formatEther(baseValue));
                setUsdValue(formatUnits(baseValue.mul(currencyPriceBN).div(100), 18));
                props.setFieldValue(props.name, baseValue);
            }
        }
    }, [props.ethBaseValue, props.currencyPrice]);

    const handleChange = (event: any) => {
        const newValue = event.target.value;
        if (newValue === undefined || newValue < 0) {
            setEthValue('0');
            setUsdValue('0');
        } else {
            if (mode === Mode.USD) {
                try {
                    const newEthValue = BigNumber.from(parseUnits(newValue, 2))
                        .mul(ethers.constants.WeiPerEther)
                        .div(currencyPriceBN);
                    setEthValue(formatEther(newEthValue));
                    setUsdValue(newValue);
                    props.setFieldValue(props.name, newEthValue);
                } catch (e) {
                    setUsdValue(newValue);
                    props.setFieldValue(props.name, undefined);
                }
            } else {
                try {
                    const newEthValue = BigNumber.from(parseEther(event.target.value));
                    setEthValue(newValue);
                    const newUsdValue = formatUnits(newEthValue.mul(currencyPriceBN).div(100), 18);
                    setUsdValue(newUsdValue);
                    props.setFieldValue(props.name, newEthValue);
                } catch (e) {
                    setEthValue(newValue);
                    props.setFieldValue(props.name, undefined);
                }
            }
        }
    };

    return (
        <Form.Group as={Row}>
            <Col sm={2}>
                <Form.Label>{props.label}</Form.Label>
            </Col>
            <Col sm={4}>
                <InputGroup>
                    <Form.Control
                        isInvalid={
                            mode === Mode.USD
                                ? !priceRegex.test(usdValue.toString())
                                : !priceRegex.test(ethValue.toString())
                        }
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
                    <div
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
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
                        }}
                    >
                        <IoIosSwap size={22} />
                    </div>
                </Form.Text>
            </Col>
            <Col sm={4}>
                <InputGroup>
                    <Form.Control type="text" value={mode === Mode.USD ? ethValue : usdValue} disabled={true} />
                    <InputGroup.Append>
                        <InputGroup.Text id="symbol">{mode === Mode.USD ? Mode.ETH : Mode.USD}</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Col>
            <ErrorMessage name={props.name} render={(msg) => <Form.Label style={{ color: 'red' }}>{msg}</Form.Label>} />
        </Form.Group>
    );
};

export default EtherInput;
