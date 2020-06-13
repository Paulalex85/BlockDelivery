import React, {useState} from "react";
import {ethers} from "ethers";
import {LinkContainer} from "react-router-bootstrap";
import {Container, Navbar, Nav} from 'react-bootstrap'
import {Account} from "./components";

const Menu = () => {
    // const mainnetProvider = new ethers.providers.InfuraProvider("mainnet", "2717afb6bf164045b5d5468031b93f87");
    const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : "http://localhost:8545");
    const [address, setAddress] = useState("");
    const [injectedProvider, setInjectedProvider] = useState();
    return (
        <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
            <Container>
                <LinkContainer to="/">
                    <Navbar.Brand>
                        Block Delivery
                    </Navbar.Brand>
                </LinkContainer>
                <Nav className="ml-auto justify-content-end">
                    <Account address={address}
                             setAddress={setAddress}
                             localProvider={localProvider}
                             injectedProvider={injectedProvider}
                             setInjectedProvider={setInjectedProvider}
                             price={1}/>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
                    <Navbar.Collapse id="responsive-navbar-nav">

                        <LinkContainer to="/create">
                            <Nav.Link>New Order</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/orders">
                            <Nav.Link>Dashboard</Nav.Link>
                        </LinkContainer>
                    </Navbar.Collapse>
                </Nav>
            </Container>
        </Navbar>
    )
};

export default Menu;
