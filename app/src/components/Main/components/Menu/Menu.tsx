import React from "react";
import {LinkContainer} from "react-router-bootstrap";
import {Container, Nav, Navbar} from 'react-bootstrap'
import {Account} from "./components";

type Props = {
    userProvider: any;
    mainnetProvider?: any;
    setInjectedProvider: any;
}

const Menu = (props: Props) => {

    return (
        <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
            <Container>
                <LinkContainer to="/">
                    <Navbar.Brand>
                        Block Delivery
                    </Navbar.Brand>
                </LinkContainer>
                <Nav className="ml-auto justify-content-end">
                    <Account userProvider={props.userProvider}
                             mainnetProvider={props.mainnetProvider}
                             setInjectedProvider={props.setInjectedProvider}/>
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
