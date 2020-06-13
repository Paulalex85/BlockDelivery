import React, {Component} from "react";
import "./css/landing-page.css"
import {Col, Container, Form, Row} from 'react-bootstrap'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faFileInvoiceDollar, faLock} from '@fortawesome/free-solid-svg-icons'
import {faGithub} from '@fortawesome/free-brands-svg-icons'
import {LoginButtonLandingPage} from "./components";

class LandingPage extends Component {

    render() {
        return (
            <div>
                <header className="masthead text-white text-center">
                    <div className="overlay"/>
                    <Container>
                        <Row>
                            <Col xl={9} className="mx-auto">
                                <h1 className="mb-5">
                                    Use blockchain and decentralization for package deliveries
                                </h1>
                            </Col>
                            <Col md={10} lg={8} xl={7} className="mx-auto">
                                <Form>
                                    <Form.Row>
                                        <LoginButtonLandingPage/>
                                    </Form.Row>
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                </header>

                <section className="features-icons bg-light text-center">
                    <Container>
                        <Row>
                            <Col lg={4}>
                                <div className="features-icons-item mx-auto mb-5 mb-lg-0 mb-lg-3">
                                    <div className="features-icons-icon d-flex">
                                        <FontAwesomeIcon icon={faLock}
                                                         className="m-auto text-primary"/>
                                    </div>
                                    <h3>Security</h3>
                                    <p className="lead mb-0">
                                        Use the power of the blockchain for safe transaction and data privacy !
                                    </p>
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="features-icons-item mx-auto mb-5 mb-lg-0 mb-lg-3">
                                    <div className="features-icons-icon d-flex">
                                        <FontAwesomeIcon icon={faFileInvoiceDollar}
                                                         className="m-auto text-primary"/>
                                    </div>
                                    <h3>Low fees</h3>
                                    <p className="lead mb-0">Only 5% fees from delivery cost !</p>
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="features-icons-item mx-auto mb-0 mb-lg-3">
                                    <div className="features-icons-icon d-flex">
                                        <FontAwesomeIcon icon={faGithub}
                                                         className="m-auto text-primary"/>
                                    </div>
                                    <h3>Transparency</h3>
                                    <p className="lead mb-0">Check the code on our <a
                                        href={"https://github.com/Paulalex85/Block-Delivery"}>Github</a> !</p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="showcase">
                    <Container fluid={true} className="p-0">
                        <Row noGutters={true}>
                            <Col lg={6} className="order-lg-2 text-white showcase-img background-1"/>
                            <Col lg={6} className="order-lg-1 my-auto showcase-text">
                                <h2>For customers</h2>
                                <p className="lead mb-0">
                                    Take the control of your order: no more hidden fees,
                                    choose your deliver worker, keep order information between you and
                                    deliver worker and seller like order detail or delivery address.
                                </p>
                            </Col>
                        </Row>
                        <Row noGutters={true}>
                            <Col lg={6} className="text-white showcase-img background-2"/>
                            <Col lg={6} className="my-auto showcase-text">
                                <h2>For deliver workers</h2>
                                <p className="lead mb-0">
                                    Feel the real independence of your company.
                                    Only deal with your clients not with us.
                                    Get the same resources and visibility than with big companies !
                                </p>
                            </Col>
                        </Row>
                        <Row noGutters={true}>
                            <Col lg={6} className="order-lg-2 text-white showcase-img background-3"/>
                            <Col lg={6} className="order-lg-1 my-auto showcase-text">
                                <h2>For sellers</h2>
                                <p className="lead mb-0">
                                    Sell food or packages without fees.
                                </p>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="call-to-action text-white text-center">
                    <div className="overlay"/>
                    <Container>
                        <Row>
                            <Col xl={9} className="mx-auto">
                                <h2 className="mb-4">Ready to get started? Start now!</h2>
                            </Col>
                            <Col md={10} lg={8} xl={7} className="mx-auto">
                                <Form>
                                    <Form.Row>
                                        <LoginButtonLandingPage/>
                                    </Form.Row>
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <footer className="footer bg-light">
                    <Container>
                        <Row>
                            <Col lg={6} className="h-100 text-center text-lg-left my-auto">
                                <ul className="list-inline mb-2">
                                    <li className="list-inline-item">
                                        <a href="/" className="text-dark">About</a>
                                    </li>
                                    <li className="list-inline-item">&sdot;</li>
                                    <li className="list-inline-item">
                                        <a href="/" className="text-dark">Contact</a>
                                    </li>
                                    <li className="list-inline-item">&sdot;</li>
                                    <li className="list-inline-item">
                                        <a href="/" className="text-dark">Terms of Use</a>
                                    </li>
                                    <li className="list-inline-item">&sdot;</li>
                                    <li className="list-inline-item">
                                        <a href="/" className="text-dark">Privacy Policy</a>
                                    </li>
                                </ul>
                                <p className="text-muted small mb-4 mb-lg-0">&copy; Your Website 2019. All Rights
                                    Reserved.</p>
                            </Col>
                            <Col lg={6} className="h-100 text-center text-lg-right my-auto">
                                <ul className="list-inline mb-0">
                                    <li className="list-inline-item mr-3">
                                        <a href="https://github.com/Paulalex85/Block-Delivery">
                                            <FontAwesomeIcon icon={faGithub}
                                                             className="fab fa-2x fa-fw m-auto text-dark"/>
                                        </a>
                                    </li>
                                </ul>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        );
    }
}

export default LandingPage;