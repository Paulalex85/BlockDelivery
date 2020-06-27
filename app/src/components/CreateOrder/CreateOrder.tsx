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

    const onChange = (value: any, type: string) => {
        switch (type) {
            case "buyer":
                setBuyer(value);
                break;
            case "seller":
                setSeller(value);
                break;
            case "deliver":
                setDeliver(value);
                break;
            case "sellerPrice":
                setSellerPrice(value);
                break;
            case "deliverPrice":
                setDeliverPrice(value);
                break;
            default:
        }
    };

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
                            onChange={(value, actor) => onChange(value, actor)}
                        />
                        <AccountInfo
                            account={seller}
                            actor={"seller"}
                            onChange={(value, actor) => onChange(value, actor)}
                        />
                        <AccountInfo
                            account={deliver}
                            actor={"deliver"}
                            onChange={(value, actor) => onChange(value, actor)}
                        />
                        <EtherInput
                            currencyPrice={0.5}
                            label={"Seller price"}
                            onChange={(value) => onChange(value, "sellerPrice")}
                        />
                        <EtherInput
                            currencyPrice={0.5}
                            label={"Deliver price"}
                            onChange={(value) => onChange(value, "deliverPrice")}
                        />
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
};

export default CreateOrder;