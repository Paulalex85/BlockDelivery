import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form, Navbar } from 'react-bootstrap';
import { NETWORKS } from '../../../../../constants';

// type Props = {};

const Network = () => {
    const [cachedNetwork, setCachedNetwork] = useState(window.localStorage.getItem('network'));
    const [targetNetwork, setTargetNetwork] = useState(NETWORKS['localhost']);

    useEffect(() => {
        setTargetNetwork(NETWORKS[cachedNetwork || 'localhost']);
        if (!targetNetwork) {
            setTargetNetwork(NETWORKS.localhost);
        }
    }, [cachedNetwork]);

    const options = [];
    for (const id in NETWORKS) {
        options.push(
            <option key={id} value={NETWORKS[id].name} style={{ color: NETWORKS[id].color }}>
                {NETWORKS[id].name}
            </option>,
        );
    }

    const handleSelectInput = (value: ChangeEvent<HTMLSelectElement>) => {
        const selectedNetwork = value.target.value;
        if (targetNetwork.chainId != NETWORKS[selectedNetwork].chainId) {
            window.localStorage.setItem('network', selectedNetwork);
            setCachedNetwork(selectedNetwork);
            setTimeout(() => {
                window.location.reload();
            }, 1);
        }
    };

    return (
        <Navbar.Text style={{ paddingRight: 10 }}>
            <Form.Control
                as="select"
                value={cachedNetwork || 'localhost'}
                style={{ textAlign: 'left', width: 120 }}
                onChange={handleSelectInput}
            >
                {options}
            </Form.Control>
        </Navbar.Text>
    );
};

export default Network;
