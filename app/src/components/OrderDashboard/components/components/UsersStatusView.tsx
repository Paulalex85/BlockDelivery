import React from 'react';
import { Badge, Col, Row } from 'react-bootstrap';

type Props = {
    title: string;
    withBuyerStatus: boolean;
    buyerStatus: boolean;
    sellerStatus: boolean;
    deliverStatus: boolean;
};

const UsersStatusView = (props: Props) => {
    return (
        <React.Fragment>
            <h5>{props.title}</h5>
            <Row className="mb-3">
                {props.withBuyerStatus ? (
                    <Col className="sm-1">
                        <h4>
                            {props.buyerStatus ? (
                                <Badge variant="success">Buyer</Badge>
                            ) : (
                                <Badge variant="danger">Buyer</Badge>
                            )}
                        </h4>
                    </Col>
                ) : (
                    <React.Fragment />
                )}
                <Col className="sm-1">
                    <h4>
                        {props.sellerStatus ? (
                            <Badge variant="success">Seller</Badge>
                        ) : (
                            <Badge variant="danger">Seller</Badge>
                        )}
                    </h4>
                </Col>
                <Col className="sm-1">
                    <h4>
                        {props.deliverStatus ? (
                            <Badge variant="success">Deliver</Badge>
                        ) : (
                            <Badge variant="danger">Deliver</Badge>
                        )}
                    </h4>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default UsersStatusView;
