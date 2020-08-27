import React, {useEffect, useState} from 'react';
import {createEthersContract} from "../../../utils/createEthersContract";
import {ListGroup, Col, Collapse, Row, Badge} from 'react-bootstrap';
import {BsChevronUp, BsChevronDown} from "react-icons/bs";

type Props = {
    orderId: any;
    userProvider: any;
}

const OrderElement = (props: Props) => {
    const [orderData, setOrderData] = useState<any>();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [colorListGroup, setColorListGroup] = useState("");
    useEffect(() => {
        createEthersContract(props.userProvider).then((contract) => {
            contract.getOrder(props.orderId).then((result: any) => {
                console.log(result);
                setOrderData(result)
            })
        });
    }, [props.userProvider]);

    useEffect(() => {
        if (orderData !== undefined && orderData.orderStage !== undefined) {
            switch (orderData.orderStage) {
                case "0":
                    setTitle("Order initialization");
                    break;
            }
        }
    }, [orderData]);

    return (
        <React.Fragment>
            {orderData !== undefined ?
                <Col className="col-sm-6 col-sm-offset-3">
                    <ListGroup.Item
                        action
                        variant={colorListGroup}
                        className="text-center"
                        onClick={() => setOpen(!open)}
                        aria-controls="collapse-order"
                        aria-expanded={open}>
                    <span className="float-left">
                        Order #{props.orderId}
                    </span>
                        <span>
                        {title}
                    </span>
                        {open ?
                            <BsChevronUp className="float-right" size='2em'/>
                            :
                            <BsChevronDown className="float-right" size='2em'/>
                        }
                    </ListGroup.Item>
                    <Collapse in={open}>
                        <ListGroup.Item id="collapse-order">
                            <h5>Users</h5>
                            <Row className="mb-3">
                                <Col>
                                    <Badge className="mr-3" variant="info">Buyer</Badge>
                                    {orderData.buyer !== undefined ? orderData.buyer : ""}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    <Badge className="mr-3" variant="info">Seller</Badge>
                                    {orderData.seller !== undefined ? orderData.seller : ""}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    <Badge className="mr-3" variant="info">Deliver</Badge>
                                    {orderData.deliver !== undefined ? orderData.deliver : ""}
                                </Col>
                            </Row>
                            <h5>Delay</h5>
                            <Row className="mb-3">
                                <Col>
                                    {/*Creation : {order.date.toLocaleTimeString() + " " + order.date.toLocaleDateString()}*/}
                                </Col>
                                <Col>
                                    {/*Max delivery : {order.dateDelay.toLocaleTimeString() + " " + order.dateDelay.toLocaleDateString()}*/}
                                </Col>
                            </Row>
                            <h5>Price</h5>
                            <Row className="mb-3">
                                <Col>
                                    Seller
                                    : {orderData.sellerPrice !== undefined ? orderData.sellerPrice.toString() : ""}
                                </Col>
                                <Col>
                                    Deliver
                                    : {orderData.deliverPrice !== undefined ? orderData.deliverPrice.toString() : ""}
                                </Col>
                            </Row>
                            {/*<h5>Order Validation</h5>*/}
                            {/*<Row className="mb-3">*/}
                            {/*    <Col className="sm-1">*/}
                            {/*        {order.validateBuyer === "1" ?*/}
                            {/*            <Badge variant="success">Buyer</Badge>*/}
                            {/*            :*/}
                            {/*            <Badge variant="danger">Buyer</Badge>*/}
                            {/*        }*/}
                            {/*    </Col>*/}
                            {/*    <Col className="sm-1">*/}
                            {/*        {order.validateSeller === "1" ?*/}
                            {/*            <Badge variant="success">Seller</Badge>*/}
                            {/*            :*/}
                            {/*            <Badge variant="danger">Seller</Badge>*/}
                            {/*        }*/}
                            {/*    </Col>*/}
                            {/*    <Col className="sm-1">*/}
                            {/*        {order.validateDeliver === "1" ?*/}
                            {/*            <Badge variant="success">Deliver</Badge>*/}
                            {/*            :*/}
                            {/*            <Badge variant="danger">Deliver</Badge>*/}
                            {/*        }*/}
                            {/*    </Col>*/}
                            {/*</Row>*/}
                            {/*<h5>Infos</h5>*/}
                            {/*<Row className="mb-3">*/}
                            {/*    <Col>*/}
                            {/*        {order.details}*/}
                            {/*    </Col>*/}
                            {/*</Row>*/}

                        </ListGroup.Item>
                    </Collapse>
                </Col>

                : <div/>
            }
        </React.Fragment>
    )
};

export default OrderElement;
