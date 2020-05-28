import React, {Component} from "react";
import {withRouter} from "react-router";
import {connect} from 'react-redux';
import {LinkContainer} from "react-router-bootstrap";
// Components
import {Button} from 'react-bootstrap';

class Logout extends Component {

    render() {
        const {logout} = this.context;
        return (
            <LinkContainer to="/">
                <Button
                    variant="outline-primary"
                    onClick={logout}>
                    Logout
                </Button>
            </LinkContainer>
        )
    }
}

const mapStateToProps = state => state;

export default withRouter(connect(mapStateToProps)(Logout));
