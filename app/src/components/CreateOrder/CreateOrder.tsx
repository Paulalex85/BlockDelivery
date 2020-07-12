import React, {useState} from 'react';
import {Card, Col, Row} from 'react-bootstrap';
import {AccountInfo, DelayPicker, EscrowInput, EtherInput, SellerDeliveryPay} from "./components";
import {Mode} from "./components/EtherInput";

type CreateOrderProps = {}

const CreateOrder = ({}: CreateOrderProps) => {
    const [buyer, setBuyer] = useState("");
    const [seller, setSeller] = useState("");
    const [deliver, setDeliver] = useState("");
    const [sellerPrice, setSellerPrice] = useState(0);
    const [deliverPrice, setDeliverPrice] = useState(0);
    const [sellerDeliveryPay, setSellerDeliveryPay] = useState(0);
    const [deliverPriceMode, setDeliverPriceMode] = useState(Mode.USD);
    const [buyerEscrow, setBuyerEscrow] = useState(0);
    const [sellerEscrow, setSellerEscrow] = useState(0);
    const [deliverEscrow, setDeliverEscrow] = useState(0);
    const [dateDelay, setDateDelay] = useState(new Date());

    return (
        <Row className="justify-content-md-center mt-5">
            <Col className="col-sm-5">
                <Card className="text-center">
                    <Card.Header>
                        Create Order
                    </Card.Header>
                    <Card.Body>
                        <AccountInfo
                            account={buyer}
                            actor={"buyer"}
                            onChange={(value) => setBuyer(value)}
                        />
                        <AccountInfo
                            account={seller}
                            actor={"seller"}
                            onChange={(value) => setSeller(value)}
                        />
                        <AccountInfo
                            account={deliver}
                            actor={"deliver"}
                            onChange={(value) => setDeliver(value)}
                        />
                        <EtherInput
                            currencyPrice={0.5}
                            label={"Seller price"}
                            onChange={(value) => setSellerPrice(value)}
                        />
                        <EtherInput
                            currencyPrice={0.5}
                            label={"Deliver price"}
                            onChange={(value) => setDeliverPrice(value)}
                            onChangeMode={(mode) => setDeliverPriceMode(mode)}
                        />
                        {deliverPrice > 0 ?
                            <SellerDeliveryPay
                                deliveryCost={deliverPrice}
                                onChange={(value) => setSellerDeliveryPay(value)}
                                currencyMode={deliverPriceMode}
                                currencyPrice={0.5}
                            />
                            : ""}
                        <DelayPicker onChange={(value) => setDateDelay(value)}/>
                        <EscrowInput
                            simpleEscrowValue={deliverPrice + sellerPrice}
                            currencyPrice={0.5}
                            onChangeBuyer={(value) => setBuyerEscrow(value)}
                            onChangeSeller={(value) => setSellerEscrow(value)}
                            onChangeDeliver={(value) => setDeliverEscrow(value)}
                        />
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
};

export default CreateOrder;