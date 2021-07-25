import React, { useEffect, useState } from 'react';
import { createEthersContract } from '../../../utils/createEthersContract';
import { Badge, ButtonToolbar, Col, Collapse, ListGroup, Row } from 'react-bootstrap';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';
import Blockies from 'react-blockies';
import { PriceDisplay } from '../../Utils';
import { EndOrder, InitializeCancel, ScanAction, UpdateOrder, ValidateOrder } from './components';
import KeyView from './components/KeyView';
import CreateUpdateDisputeRefund from './components/CreateUpdateDisputeRefund';
import UsersStatusView from './components/UsersStatusView';
import { BigNumber } from 'ethers';

type Props = {
    orderId: number;
    userProvider: any;
    route: any;
};

interface OrderData {
    buyer: string;
    seller: string;
    deliver: string;
    deliverPrice: BigNumber;
    sellerPrice: BigNumber;
    sellerDeliveryPay: BigNumber;
    orderStage: number;
    startDate: BigNumber;
    buyerValidation: boolean;
    sellerValidation: boolean;
    deliverValidation: boolean;
    sellerHash: string;
    buyerHash: string;
}

interface EscrowData {
    delayEscrow: BigNumber;
    escrowBuyer: BigNumber;
    escrowSeller: BigNumber;
    escrowDeliver: BigNumber;
}

interface DisputeDate {
    buyerReceive: BigNumber;
    sellerBalance: number;
    buyerAcceptEscrow: boolean;
    sellerAcceptEscrow: boolean;
    deliverAcceptEscrow: boolean;
}

const OrderElement = (props: Props) => {
    const [orderData, setOrderData] = useState<OrderData>();
    const [escrowData, setEscrowData] = useState<EscrowData>();
    const [disputeData, setDisputeData] = useState<DisputeDate>({
        buyerReceive: BigNumber.from(0),
        sellerBalance: 0,
        buyerAcceptEscrow: false,
        sellerAcceptEscrow: false,
        deliverAcceptEscrow: false,
    });
    const [open, setOpen] = useState(false);
    const [userKey, setUserKey] = useState('');
    const [title, setTitle] = useState('');
    const [colorListGroup, setColorListGroup] = useState('');

    useEffect(() => {
        createEthersContract(props.userProvider).then((contract) => {
            contract.getOrder(props.orderId).then((orderResult: OrderData) => {
                console.log(orderResult);
                setOrderData(orderResult);
                contract.getEscrow(props.orderId).then((escrowResult: EscrowData) => {
                    console.log(escrowResult);
                    setEscrowData(escrowResult);
                    contract.getDispute(props.orderId).then((disputeResult: DisputeDate) => {
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
                            {orderData.orderStage === 0 ? (
                                <UsersStatusView
                                    title={'Order Validation'}
                                    buyerStatus={orderData.buyerValidation}
                                    sellerStatus={orderData.sellerValidation}
                                    deliverStatus={orderData.deliverValidation}
                                />
                            ) : (
                                <React.Fragment />
                            )}
                            {orderData.orderStage === 6 ? (
                                <UsersStatusView
                                    title={'Dispute Validation'}
                                    buyerStatus={disputeData.buyerAcceptEscrow}
                                    sellerStatus={disputeData.sellerAcceptEscrow}
                                    deliverStatus={disputeData.deliverAcceptEscrow}
                                />
                            ) : (
                                <React.Fragment />
                            )}
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
                                <CreateUpdateDisputeRefund
                                    orderId={props.orderId}
                                    orderData={orderData}
                                    disputeData={disputeData}
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
