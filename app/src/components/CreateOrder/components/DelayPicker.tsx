import React, {useEffect, useState} from 'react';
import {Form, Row, Col} from 'react-bootstrap';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import {ErrorMessage} from "formik";
import {BigNumber} from "ethers";

type DelayPickerProps = {
    setFieldValue: any
    name: string
    errors: any
    initialValue: string
}

const DelayPicker = (props: DelayPickerProps) => {

    const [delay, setDelay] = useState(new Date());

    useEffect(() => {
        if (props.initialValue !== undefined) {
            handleChange(new Date(BigNumber.from(props.initialValue).mul(1000).toNumber()))
        } else {
            handleChange(new Date())
        }
    }, [props.initialValue]);

    const handleChange = (date: Date) => {
        setDelay(date);
        props.setFieldValue(props.name, date);
    };

    return (
        <Form.Group as={Row}>
            <Col sm={4}>
                <Form.Label>
                    Max delay of the contract
                </Form.Label>
            </Col>
            <Col sm={6}>
                <DatePicker
                    selected={delay}
                    onChange={handleChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="d/M/yyyy HH:mm"
                    timeCaption="Time"
                    minDate={new Date()}
                />
            </Col>
            <ErrorMessage name={props.name}
                          render={(msg) => <Form.Label style={{color: "red"}}>{msg}</Form.Label>}/>
        </Form.Group>
    )
};

export default DelayPicker;