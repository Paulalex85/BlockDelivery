import React, {useState, useEffect} from 'react'
import Blockies from 'react-blockies';
import QrReader from 'react-qr-reader'
import {AiOutlineQrcode} from 'react-icons/ai';
import {Form, Row, Col} from 'react-bootstrap';

type AddressInputProps = {
    value: string
    ensProvider?: any
    onChange: (address: string) => void
    actor: string
    disabled: boolean
}

const AddressInput = ({value, ensProvider, onChange, actor, disabled}: AddressInputProps) => {

    const [ens, setEns] = useState("");
    const [valueState, setValueState] = useState(typeof value != "undefined" ? value : "");
    const [scan, setScan] = useState(false);

    useEffect(() => {
        setEns("");
        if (ensProvider) {
            getEns().then();
        }
    }, [ensProvider]);

    async function getEns() {
        let newEns;
        try {
            newEns = await ensProvider.lookupAddress(valueState);
            setEns(newEns)
        } catch (e) {
        }
        console.log("checking resolve");
        if (valueState.indexOf(".eth") > 0 || valueState.indexOf(".xyz") > 0) {
            try {
                console.log("resolving");
                let possibleAddress = await ensProvider.resolveName(valueState);
                console.log("GOT:L", possibleAddress);
                if (possibleAddress) {
                    setEns(valueState);
                    onChange(possibleAddress)
                }
            } catch (e) {
            }
        }
    }

    let scannerButton = (
        <div onClick={() => {
            setScan(!scan)
        }}>
            <AiOutlineQrcode size={30}/>
        </div>
    );


    const updateAddress = async (newValue: string) => {
        if (typeof newValue != "undefined") {
            let address = newValue;
            if (address.indexOf(".eth") > 0 || address.indexOf(".xyz") > 0) {
                try {
                    let possibleAddress = await ensProvider.resolveName(address);
                    if (possibleAddress) {
                        address = possibleAddress
                    }
                } catch (e) {
                }
            }
            setValueState(address);
            if (typeof onChange == "function") {
                onChange(address)
            }
        }
    };


    let scanner;
    if (scan) {
        scanner = (
            <div style={{zIndex: 256, position: 'absolute', left: 0, top: 0, width: "100%"}} onClick={() => {
                setScan(!scan)
            }}>
                <QrReader
                    delay={250}
                    onError={(e: any) => {
                        console.log("SCAN ERROR", e);
                        setScan(!scan)
                    }}
                    onScan={(newValue) => {
                        if (newValue) {
                            console.log("SCAN VALUE", newValue);
                            let possibleNewValue = newValue;
                            if (possibleNewValue.lastIndexOf("0x") > 0) {
                                possibleNewValue = possibleNewValue.substr(possibleNewValue.lastIndexOf("0x"));
                                console.log("CLEANED VALUE", possibleNewValue)
                            }
                            setScan(!scan);
                            updateAddress(possibleNewValue).then()
                        }
                    }}
                    style={{width: '100%'}}
                />
            </div>
        )
    }

    let label = actor.charAt(0).toUpperCase() + actor.slice(1);

    return (
        <div>
            {scanner}
            <Form.Group as={Row}>
                <Form.Label column sm={2}>
                    {label}
                </Form.Label>
                <Col sm={1}>
                    <Blockies seed={valueState.toString().toLowerCase()} size={8} scale={4}/>
                </Col>
                <Col sm={8}>
                    <Form.Control
                        disabled={disabled}
                        type="text"
                        value={ens ? ens : valueState}
                        onChange={(e) => updateAddress(e.target.value).then()}/>
                </Col>
                <Col sm={1}>
                    {scannerButton}
                </Col>
            </Form.Group>
        </div>
    );
};

export default AddressInput;