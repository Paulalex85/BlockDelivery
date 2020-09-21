import React, {useEffect, useState} from 'react';
import {Col, Form, Row} from 'react-bootstrap';
import AddressInput from "./AddressInput";
import {useSelector} from "react-redux";
import {getUserAddress} from "../../../redux/selectors"
import {ErrorMessage} from "formik";

type AccountInfoProps = {
    setFieldValue: any
    name: string
    errors: any
    initialValue: string
}

const AccountInfo = (props: AccountInfoProps) => {
    const [disabled, setDisabled] = useState(false);
    const [account, setAccount] = useState("");
    const userAddress = useSelector(getUserAddress);

    useEffect(() => {
        handleChange(props.initialValue)
    }, [props.initialValue]);

    const handleCheckBox = async (event: any) => {
        if (event.target.checked === true) {
            const name = userAddress;
            setDisabled(true);
            handleChange(name);
        } else {
            setDisabled(false);
        }
    };

    const handleChange = (value: string) => {
        setAccount(value);
        props.setFieldValue(props.name, value);
    };

    let labelCheckBox = "I'm the " + props.name;

    return (
        <Form.Group>
            <Row>
                <Col>
                    <AddressInput
                        value={account}
                        onChange={(value: string) => handleChange(value)}
                        actor={props.name}
                        disabled={disabled}
                    />
                </Col>
                <Col sm={4}>
                    <Form.Check
                        onChange={handleCheckBox}
                        label={labelCheckBox}
                    />
                </Col>
            </Row>
            <Row>
                <ErrorMessage name={props.name}
                              render={(msg) => <Form.Label style={{color: "red"}}>{msg}</Form.Label>}/>
            </Row>
        </Form.Group>
    )
};

export default AccountInfo;