import React, {useEffect, useState} from 'react'
import Blockies from 'react-blockies';
import {Navbar} from 'react-bootstrap'
import CopyText from "./CopyText";

type AddressProps = {
    value: string;
    ensProvider?: any;
    size?: string;
    minimized?: boolean;
}

const Address = ({value, ensProvider, size, minimized}: AddressProps) => {

    const [ens, setEns] = useState("");
    let blockExplorer = "https://etherscan.io/address/";

    useEffect(() => {
        if (value && ensProvider) {
            getEns().then();
        }
    }, [value, ensProvider]);

    async function getEns() {
        let newEns;
        try {
            newEns = await ensProvider.lookupAddress(value);
            setEns(newEns)
        } catch (e) {
        }
    }

    if (!value) {
        return (
            <Navbar.Text>
            </Navbar.Text>
        )
    }

    let displayAddress = value.substr(0, 6);

    if (ens) {
        displayAddress = ens
    } else if (size === "short") {
        displayAddress += "..." + value.substr(-4)
    } else if (size === "long") {
        displayAddress = value
    }


    if (minimized) {
        return (
            <Navbar.Text>
                <a style={{color: "#222222"}} href={blockExplorer + value}>
                    <Blockies seed={value.toLowerCase()} size={8} scale={2}/>
                </a>
            </Navbar.Text>
        );
    }

    return (
        <Navbar.Text>
            <span style={{verticalAlign: "middle", paddingRight: 5}}>
                <Blockies seed={value.toString().toLowerCase()} size={8} scale={4}/>
            </span>
            <Navbar.Text style={{paddingRight: 2}}>
                <a style={{color: "#222222"}} href={blockExplorer + value}>{displayAddress}</a>
            </Navbar.Text>
            <Navbar.Text style={{paddingRight: 5}}>
                <CopyText value={value}/>
            </Navbar.Text>
        </Navbar.Text>
    );
};

export default Address;