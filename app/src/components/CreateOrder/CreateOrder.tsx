import React, {useState} from 'react';
import {Card, Col, Row} from 'react-bootstrap';
import {AccountInfo, EtherInput} from "./components";

type CreateOrderProps = {}

const CreateOrder = ({}: CreateOrderProps) => {
    const [buyer, setBuyer] = useState("");
    const [seller, setSeller] = useState("");
    const [deliver, setDeliver] = useState("");
    const [sellerPrice, setSellerPrice] = useState(0);
    const [deliverPrice, setDeliverPrice] = useState(0);

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
                        />
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
};

export default CreateOrder;