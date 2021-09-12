import React, { useState } from 'react';
// Components
import QrReader from 'react-qr-reader';
import { Col, Form, Row } from 'react-bootstrap';
import { AiOutlineQrcode } from 'react-icons/all';

type Props = {
    onChange: (hash: string) => void;
};

const HashQRCodeReader = (props: Props) => {
    const [scan, setScan] = useState(false);

    const scannerButton = (
        <div
            onClick={() => {
                setScan(!scan);
            }}
        >
            <AiOutlineQrcode size={30} />
        </div>
    );

    let scanner;
    if (scan) {
        scanner = (
            <div
                style={{ zIndex: 256, position: 'absolute', left: 0, top: 0, width: '100%' }}
                onClick={() => {
                    setScan(!scan);
                }}
            >
                <QrReader
                    delay={250}
                    onError={(e: any) => {
                        console.log('SCAN ERROR', e);
                        setScan(!scan);
                    }}
                    onScan={(newValue) => {
                        if (newValue) {
                            console.log('SCAN VALUE', newValue);
                            let possibleNewValue = newValue;
                            if (possibleNewValue.lastIndexOf('0x') > 0) {
                                possibleNewValue = possibleNewValue.substr(possibleNewValue.lastIndexOf('0x'));
                                console.log('CLEANED VALUE', possibleNewValue);
                            }
                            setScan(!scan);
                            props.onChange(possibleNewValue);
                        }
                    }}
                    style={{ width: '100%' }}
                />
            </div>
        );
    }

    return (
        <div>
            {scanner}
            <Form.Group as={Row}>
                <Col sm={1}>{scannerButton}</Col>
            </Form.Group>
        </div>
    );
};

export default HashQRCodeReader;
