import React, {useState} from 'react';
import {Form, Col, Row} from 'react-bootstrap';
import AddressInput from "./AddressInput";
import {useSelector} from "react-redux";
import {getUserAddress} from "../../../redux/selectors"

type AccountInfoProps = {
    setFieldValue: any
    name: string
    touched: any
    errors: any
}

const AccountInfo = (props: AccountInfoProps) => {
    const [disabled, setDisabled] = useState(false);
    const [account, setAccount] = useState("");
    const userAddress = useSelector(getUserAddress);

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
    )
};

export default AccountInfo;