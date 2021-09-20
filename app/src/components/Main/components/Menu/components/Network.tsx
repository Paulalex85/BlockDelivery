import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form, Navbar, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { NETWORK, NETWORKS } from '../../../../../constants';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Network as EthersNetwork } from '@ethersproject/networks';
import { AiOutlineWarning } from 'react-icons/ai';
import { providers } from 'ethers';

type Props = {
    userProvider: providers.Web3Provider;
};

const Network = (props: Props) => {
    const defaultNetwork = 'ropsten';
    const [cachedNetwork, setCachedNetwork] = useState(window.localStorage.getItem('network'));
    const [targetNetwork, setTargetNetwork] = useState(NETWORKS[defaultNetwork]);
    const [localProvider, setLocalProvider] = useState<StaticJsonRpcProvider>(
        new StaticJsonRpcProvider(NETWORKS[defaultNetwork].rpcUrl),
    );
    const [wrongNetwork, setWrongNetwork] = useState(false);
    const [localChainId, setLocalChainId] = useState(0);
    const [selectedChainId, setSelectedChainId] = useState(0);

    useEffect(() => {
        if (cachedNetwork !== null && NETWORKS[cachedNetwork] !== undefined) {
            setTargetNetwork(NETWORKS[cachedNetwork]);
        } else {
            setTargetNetwork(NETWORKS[defaultNetwork]);
        }
    }, [cachedNetwork]);

    useEffect(() => {
        const localProviderUrl = targetNetwork.rpcUrl;
        setLocalProvider(new StaticJsonRpcProvider(localProviderUrl));
    }, [targetNetwork]);

    useEffect(() => {
        localProvider.getNetwork().then((localNetwork: EthersNetwork) => {
            const localId = localNetwork.chainId;
            setLocalChainId(localId);
            props.userProvider.getNetwork().then((network: EthersNetwork) => {
                const selectedId = network.chainId;
                setSelectedChainId(selectedId);

                if (localId && selectedId && localId !== selectedId) {
                    setWrongNetwork(true);
                } else {
                    setWrongNetwork(false);
                }
            });
        });
    }, [localProvider, props.userProvider]);

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
        <React.Fragment>
            <Navbar.Text style={{ paddingRight: 10 }}>
                <Form.Control
                    as="select"
                    value={cachedNetwork || defaultNetwork}
                    style={{ textAlign: 'left', width: 120 }}
                    onChange={handleSelectInput}
                >
                    {options}
                </Form.Control>
            </Navbar.Text>
            <Navbar.Text style={{ paddingRight: 10 }}>
                {wrongNetwork ? (
                    <OverlayTrigger
                        placement={'bottom'}
                        overlay={
                            <Tooltip id={'networkWarningTooltip'}>
                                Wrong network. Selected {NETWORK(localChainId).name} but connected with{' '}
                                {NETWORK(selectedChainId).name}
                            </Tooltip>
                        }
                    >
                        <AiOutlineWarning size={30} />
                    </OverlayTrigger>
                ) : (
                    <React.Fragment />
                )}
            </Navbar.Text>
        </React.Fragment>
    );
};

export default Network;
