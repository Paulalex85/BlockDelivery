import React, {Component} from "react";
import {LinkContainer} from "react-router-bootstrap";
import {ButtonLogged, Login} from './components'
import {Container, Navbar} from 'react-bootstrap'

class Menu extends Component {

    render() {
        const {activeUser} = this.props.drizzleState.accounts !== undefined && this.props.drizzleState.accounts.length > 0;
        return (
            <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
                <Container>
                    <LinkContainer to="/">
                        <Navbar.Brand>
                            Block Delivery
                        </Navbar.Brand>
                    </LinkContainer>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
                    <Navbar.Collapse className="justify-content-end" id="responsive-navbar-nav">
                        {
                            activeUser
                                ? (<ButtonLogged/>)
                                : (<Login drizzle={this.props.drizzle}
                                          drizzleState={this.props.drizzleState}/>)
                        }
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        )
    }
}

export default Menu;