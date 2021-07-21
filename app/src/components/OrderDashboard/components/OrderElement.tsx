import React, { useEffect, useState } from 'react';
import { createEthersContract } from '../../../utils/createEthersContract';
import { Badge, ButtonToolbar, Col, Collapse, ListGroup, Row } from 'react-bootstrap';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';
import Blockies from 'react-blockies';
import { PriceDisplay } from '../../Utils';
import { EndOrder, InitializeCancel, ScanAction, UpdateOrder, ValidateOrder } from './components';
import KeyView from './components/KeyView';

type Props = {
    orderId: number;
    userProvider: any;
    route: any;
};

const OrderElement = (props: Props) => {
    const [orderData, setOrderData] = useState<any>();
    const [escrowData, setEscrowData] = useState<any>();
    const [disputeData, setDisputeData] = useState<any>();
    const [open, setOpen] = useState(false);
    const [userKey, setUserKey] = useState('');
    const [title, setTitle] = useState('');
    const [colorListGroup, setColorListGroup] = useState('');

    useEffect(() => {
        createEthersContract(props.userProvider).then((contract) => {
            contract.getOrder(props.orderId).then((orderResult: any) => {
                console.log(orderResult);
                setOrderData(orderResult);
                contract.getEscrow(props.orderId).then((escrowResult: any) => {
                    console.log(escrowResult);
                    setEscrowData(escrowResult);
                    contract.getDispute(props.orderId).then((disputeResult: any) => {
                        console.log(disputeResult);
                        setDisputeData(disputeResult);
                    });
                });
            });
        });
    }, [props.userProvider]);

    useEffect(() => {
        if (orderData !== undefined && orderData.orderStage !== undefined) {
            switch (orderData.orderStage) {
                case 0:
                    setTitle('New order - Wait acceptation');
                    break;
                case 1:
                    setTitle('Accepted - Wait seller preparing order');
                    setColorListGroup('info');
                    break;
                case 2:
                    setTitle('Prepared - Wait the deliver');
                    setColorListGroup('info');
                    break;
                case 3:
                    setTitle('Delivered - Wait the buyer validation');
                    setColorListGroup('info');
                    break;
                case 4:
                    setTitle('Finished');
                    setColorListGroup('success');
                    break;
                case 5:
                    setTitle('Order cancelled');
                    setColorListGroup('danger');
                    break;
                case 6:
                    setTitle('Dispute refund determination');
                    setColorListGroup('danger');
                    break;
                case 7:
                    setTitle('Dispute cost repartition');
                    setColorListGroup('danger');
                    break;
            }
        }
    }, [orderData]);

    return (
        <React.Fragment>
            {orderData !== undefined && escrowData !== undefined ? (
                <Col className="col-sm-6 col-sm-offset-3">
                    <ListGroup.Item
                        action
                        variant={colorListGroup}
                        className="text-center"
                        onClick={() => setOpen(!open)}
                        aria-controls="collapse-order"
                        aria-expanded={open}
                    >
                        <span className="float-left">Order #{props.orderId}</span>
                        <span>{title}</span>
                        {open ? (
                            <BsChevronUp className="float-right" size="2em" />
                        ) : (
                            <BsChevronDown className="float-right" size="2em" />
                        )}
                    </ListGroup.Item>
                    <Collapse in={open}>
                        <ListGroup.Item id="collapse-order">
                            <h5>Users</h5>
                            <Row className="mb-3">
                                <Col>
                                    <span style={{ fontSize: '1.5em' }}>
                                        <Badge className="mr-3" variant="info">
                                            Buyer
                                        </Badge>
                                    </span>
                                    <span style={{ verticalAlign: 'middle', paddingRight: 5 }}>
                                        <Blockies seed={orderData.buyer.toLowerCase()} size={8} scale={4} />
                                    </span>
                                    {orderData.buyer !== undefined ? orderData.buyer : ''}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    <span style={{ fontSize: '1.5em' }}>
                                        <Badge className="mr-3" variant="info">
                                            Seller
                                        </Badge>
                                    </span>
                                    <span style={{ verticalAlign: 'middle', paddingRight: 5 }}>
                                        <Blockies seed={orderData.seller.toLowerCase()} size={8} scale={4} />
                                    </span>
                                    {orderData.seller !== undefined ? orderData.seller : ''}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    <span style={{ fontSize: '1.5em' }}>
                                        <Badge className="mr-3" variant="info">
                                            Deliver
                                        </Badge>
                                    </span>
                                    <span style={{ verticalAlign: 'middle', paddingRight: 5 }}>
                                        <Blockies seed={orderData.deliver.toLowerCase()} size={8} scale={4} />
                                    </span>
                                    {orderData.deliver !== undefined ? orderData.deliver : ''}
                                </Col>
                            </Row>
                            <h5>Delay Delivery</h5>
                            <Row className="mb-3">
                                <Col>
                                    Start delay :{' '}
                                    {orderData.startDate !== null && orderData.startDate.toNumber() > 0
                                        ? new Date(orderData.startDate.toNumber() * 1000).toLocaleTimeString() +
                                          ' ' +
                                          new Date(orderData.startDate.toNumber() * 1000).toLocaleDateString()
                                        : 'Wait the order to be started'}
                                </Col>
                                <Col>
                                    Max delay delivery :{' '}
                                    {escrowData.delayEscrow !== undefined
                                        ? new Date(escrowData.delayEscrow.toNumber() * 1000).toLocaleTimeString() +
                                          ' ' +
                                          new Date(escrowData.delayEscrow.toNumber() * 1000).toLocaleDateString()
                                        : ''}
                                </Col>
                            </Row>
                            <h5>Price</h5>
                            <Row className="mb-3">
                                <Col>
                                    Seller :{' '}
                                    {orderData.sellerPrice !== undefined ? (
                                        <PriceDisplay dollarMultiplier={2} weiAmount={orderData.sellerPrice} />
                                    ) : (
                                        ''
                                    )}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    Deliver :{' '}
                                    {orderData.deliverPrice !== undefined ? (
                                        <PriceDisplay dollarMultiplier={2} weiAmount={orderData.deliverPrice} />
                                    ) : (
                                        ''
                                    )}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col>
                                    Delivery paid by seller :{' '}
                                    {orderData.sellerDeliveryPay !== undefined ? (
                                        <PriceDisplay dollarMultiplier={2} weiAmount={orderData.sellerDeliveryPay} />
                                    ) : (
                                        ''
                                    )}
                                </Col>
                            </Row>
                            <h5>Escrows</h5>
                            <Row className="mb-3">
                                <Col>
                                    Buyer :{' '}
                                    {escrowData.escrowBuyer !== undefined ? (
                                        <PriceDisplay dollarMultiplier={2} weiAmount={escrowData.escrowBuyer} />
                                    ) : (
                                        ''
                                    )}
                                </Col>
                                <Col>
                                    Seller :{' '}
                                    {escrowData.escrowSeller !== undefined ? (
                                        <PriceDisplay dollarMultiplier={2} weiAmount={escrowData.escrowSeller} />
                                    ) : (
                                        ''
                                    )}
                                </Col>
                                <Col>
                                    Deliver :{' '}
                                    {escrowData.escrowDeliver !== undefined ? (
                                        <PriceDisplay dollarMultiplier={2} weiAmount={escrowData.escrowDeliver} />
                                    ) : (
                                        ''
                                    )}
                                </Col>
                            </Row>
                            <h5>Order Validation</h5>
                            <Row className="mb-3">
                                <Col className="sm-1">
                                    <h4>
                                        {orderData.buyerValidation ? (
                                            <Badge variant="success">Buyer</Badge>
                                        ) : (
                                            <Badge variant="danger">Buyer</Badge>
                                        )}
                                    </h4>
                                </Col>
                                <Col className="sm-1">
                                    <h4>
                                        {orderData.sellerValidation ? (
                                            <Badge variant="success">Seller</Badge>
                                        ) : (
                                            <Badge variant="danger">Seller</Badge>
                                        )}
                                    </h4>
                                </Col>
                                <Col className="sm-1">
                                    <h4>
                                        {orderData.deliverValidation ? (
                                            <Badge variant="success">Deliver</Badge>
                                        ) : (
                                            <Badge variant="danger">Deliver</Badge>
                                        )}
                                    </h4>
                                </Col>
                            </Row>
                            <ButtonToolbar className="justify-content-between">
                                <ScanAction
                                    orderData={orderData}
                                    orderId={props.orderId}
                                    userProvider={props.userProvider}
                                />
                                <KeyView
                                    orderId={props.orderId}
                                    orderData={orderData}
                                    escrowData={escrowData}
                                    userProvider={props.userProvider}
                                    key={userKey}
                                />
                                <EndOrder
                                    orderId={props.orderId}
                                    orderData={orderData}
                                    userProvider={props.userProvider}
                                />
                                <ValidateOrder
                                    orderData={orderData}
                                    escrowData={escrowData}
                                    userProvider={props.userProvider}
                                    orderId={props.orderId}
                                    setUserKey={setUserKey}
                                />
                                <UpdateOrder
                                    orderData={orderData}
                                    escrowData={escrowData}
                                    orderId={props.orderId}
                                    route={props.route}
                                />
                                <InitializeCancel
                                    orderData={orderData}
                                    orderId={props.orderId}
                                    userProvider={props.userProvider}
                                />
                            </ButtonToolbar>
                        </ListGroup.Item>
                    </Collapse>
                </Col>
            ) : (
                <React.Fragment />
            )}
        </React.Fragment>
    );
};

export default OrderElement;
