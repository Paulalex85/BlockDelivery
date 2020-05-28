import React, { Component } from "react";
import { Nav } from 'react-bootstrap';
import { LinkContainer } from "react-router-bootstrap";


import { Logout } from './components'

class ButtonLogged extends Component {

    render() {
        return (
            <Nav className="ml-auto">
                <LinkContainer to="/orders">
                    <Nav.Link>Orders</Nav.Link>
                </LinkContainer>
                <Logout />
            </Nav>
        )
    }
}

export default ButtonLogged