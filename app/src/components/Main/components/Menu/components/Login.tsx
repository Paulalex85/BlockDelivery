import React, {Component} from "react";
import {Nav, Button} from 'react-bootstrap';

class Login extends Component {
    render() {
        return (
            <Nav className="ml-auto">
                <Button
                    variant="primary">
                    Login
                </Button>
            </Nav>
        )
    }
}

export default Login;