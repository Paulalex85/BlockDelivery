import React, { Component } from 'react';
import './css/landing-page.css';
import { Col, Container, Row } from 'react-bootstrap';
import { FaLock, FaFileInvoiceDollar, FaGithub } from 'react-icons/fa';

class LandingPage extends Component {
    render(): JSX.Element {
        return (
            <div>
                <header className="masthead text-white text-center">
                    <div className="overlay" />
                    <Container>
                        <Row>
                            <Col xl={9} className="mx-auto">
                                <h1 className="mb-5">Package delivery on Ethereum</h1>
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
                                        <FaLock className="m-auto" />
                                    </div>
                                    <h3>Security</h3>
                                    <p className="lead mb-0">
                                        Use the power of the blockchain for safer transactions and freedom !
                                    </p>
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="features-icons-item mx-auto mb-5 mb-lg-0 mb-lg-3">
                                    <div className="features-icons-icon d-flex">
                                        <FaFileInvoiceDollar className="m-auto" />
                                    </div>
                                    <h3>Low fees</h3>
                                    <p className="lead mb-0">Only 1% delivery fee</p>
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="features-icons-item mx-auto mb-0 mb-lg-3">
                                    <div className="features-icons-icon d-flex">
                                        <FaGithub className="m-auto" />
                                    </div>
                                    <h3>Transparency</h3>
                                    <p className="lead mb-0">
                                        Check the code on{' '}
                                        <a
                                            href="https://github.com/Paulalex85/BlockDelivery"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Github
                                        </a>{' '}
                                        !
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <section className="showcase">
                    <Container fluid={true} className="p-0">
                        <Row noGutters={true}>
                            <Col lg={6} className="order-lg-2 text-white showcase-img background-1" />
                            <Col lg={6} className="order-lg-1 my-auto showcase-text">
                                <h2>For customers</h2>
                                <p className="lead mb-0">
                                    Take the control of your order: no more hidden cost, choose your deliver worker,
                                    keep order information between you, deliver worker and seller like order detail or
                                    delivery address.
                                </p>
                            </Col>
                        </Row>
                        <Row noGutters={true}>
                            <Col lg={6} className="text-white showcase-img background-2" />
                            <Col lg={6} className="my-auto showcase-text">
                                <h2>For workers</h2>
                                <p className="lead mb-0">
                                    No third-parties, work directly with peoples. No payment delays, get paid when the
                                    delivery is finished. Only 1% delivery fee to support the project. Own your network
                                    and increase it.
                                </p>
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
                                        <a href="/" className="text-dark">
                                            About
                                        </a>
                                    </li>
                                    <li className="list-inline-item">&sdot;</li>
                                    <li className="list-inline-item">
                                        <a href="mailto:contact@blockdelivery.io" className="text-dark">
                                            Contact
                                        </a>
                                    </li>
                                    <li className="list-inline-item">&sdot;</li>
                                    <li className="list-inline-item">
                                        <a href="/" className="text-dark">
                                            Terms of Use
                                        </a>
                                    </li>
                                    <li className="list-inline-item">&sdot;</li>
                                    <li className="list-inline-item">
                                        <a href="/" className="text-dark">
                                            Privacy Policy
                                        </a>
                                    </li>
                                </ul>
                                <p className="text-muted small mb-4 mb-lg-0">Block Delivery</p>
                            </Col>
                            <Col lg={6} className="h-100 text-center text-lg-right my-auto">
                                <ul className="list-inline mb-0">
                                    <li className="list-inline-item mr-3">
                                        <a
                                            href="https://github.com/Paulalex85/BlockDelivery"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <FaGithub className="fab fa-2x fa-fw m-auto text-dark" />
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
