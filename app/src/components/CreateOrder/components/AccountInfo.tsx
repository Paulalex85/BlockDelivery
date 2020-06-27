import React, {useState} from 'react';
import {Form, Col, Row} from 'react-bootstrap';
import AddressInput from "./AddressInput";
import {useSelector} from "react-redux";
import {getUserAddress} from "../../../redux/selectors"

type AccountInfoProps = {
    actor: string
    account: string
    onChange: (account: string, actor: string) => void
}

const AccountInfo = ({actor, account, onChange}: AccountInfoProps) => {
    const [disabled, setDisabled] = useState(false);
    const [accountState, setAccountState] = useState(account);
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
        setAccountState(value);
        onChange(value, actor)
    };

    let labelCheckBox = "I'm the " + actor;

    return (
        <Row>
            <Col>
                <AddressInput
                    value={accountState}
                    onChange={(value: string) => handleChange(value)}
                    actor={actor}
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