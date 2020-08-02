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

const AddressInput = (props: AddressInputProps) => {
    const regexENS = RegExp('[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?');
    const regexEthAddress = RegExp('^0x[a-fA-F0-9]*$');

    const [ens, setEns] = useState("");
    const [value, setValue] = useState("");
    const [scan, setScan] = useState(false);

    useEffect(() => {
        setEns("");
        if (props.value !== undefined) {
            setValue(props.value)
        }
        if (props.ensProvider) {
            getEns().then();
        }
    }, [props.ensProvider, props.value]);

    async function getEns() {
        let newEns;
        try {
            newEns = await props.ensProvider.lookupAddress(value);
            setEns(newEns)
        } catch (e) {
        }
        console.log("checking resolve");
        if (value.indexOf(".eth") > 0 || value.indexOf(".xyz") > 0) {
            try {
                console.log("resolving");
                let possibleAddress = await props.ensProvider.resolveName(value);
                console.log("GOT:L", possibleAddress);
                if (possibleAddress) {
                    setEns(value);
                    props.onChange(possibleAddress)
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
                    let possibleAddress = await props.ensProvider.resolveName(address);
                    if (possibleAddress) {
                        address = possibleAddress
                    }
                } catch (e) {
                }
            }
            setValue(address);
            if (typeof props.onChange == "function") {
                props.onChange(address)
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

    let label = props.actor.charAt(0).toUpperCase() + props.actor.slice(1);

    return (
        <div>
            {scanner}
            <Form.Group as={Row}>
                <Form.Label column sm={2}>
                    {label}
                </Form.Label>
                <Col sm={1}>
                    <Blockies seed={value.toString().toLowerCase()} size={8} scale={4}/>
                </Col>
                <Col sm={8}>
                    <Form.Control
                        isInvalid={value !== "" ? ens ? !regexENS.test(ens.toString()) : !regexEthAddress.test(value.toString()) : false}
                        disabled={props.disabled}
                        type="text"
                        value={ens ? ens : value}
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