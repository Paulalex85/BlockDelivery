import React, {Component} from "react";
import {Button, Col} from 'react-bootstrap';
import {LinkContainer} from "react-router-bootstrap";

class LoginButtonLandingPage extends Component {

    render() {
        return (
            <Col>
                <LinkContainer to="/orders">
                    <Button
                        className="btn btn-lg btn-primary">
                        Order page
                    </Button>
                </LinkContainer>
                <Button
                    className="btn btn-lg btn-primary">
                    Start now !
                </Button>
            </Col>
        )
    }
}

export default LoginButtonLandingPage;