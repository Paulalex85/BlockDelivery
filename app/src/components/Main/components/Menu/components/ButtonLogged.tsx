import React, {Component} from "react";
import {Nav} from 'react-bootstrap';
import {LinkContainer} from "react-router-bootstrap";

class ButtonLogged extends Component {

    render() {
        return (
            <Nav className="ml-auto">
                <LinkContainer to="/orders">
                    <Nav.Link>Orders</Nav.Link>
                </LinkContainer>
            </Nav>
        )
    }
}

export default ButtonLogged