import React, {useState} from 'react';
import {Card, Col, Row, Form, Button} from 'react-bootstrap';
import {AccountInfo, DelayPicker, EscrowInput, EtherInput, SellerDeliveryPay} from "./components";
import {Mode} from "./components/EtherInput";
import {FormikErrors, FormikProps, withFormik} from "formik"

type CreateOrderProps = {}

export interface FormValues {
    buyer: string;
    seller: string;
    deliver: string;
    sellerPrice: number;
    deliverPrice: number;
    sellerDeliveryPay: number;
    buyerEscrow: number;
    sellerEscrow: number;
    deliverEscrow: number;
    dateDelay: object;
}

interface FormProps {
    message: string;
}

interface FormErrors {
    sellerPrice: string;
}

const CreateForm = (props: CreateOrderProps & FormikProps<FormValues>) => {
    const {touched, errors, isSubmitting, handleReset, handleSubmit, setFieldValue} = props;

    // const [buyer, setBuyer] = useState("");
    // const [seller, setSeller] = useState("");
    // const [deliver, setDeliver] = useState("");
    // const [sellerPrice, setSellerPrice] = useState(0);
    // const [deliverPrice, setDeliverPrice] = useState(0);
    // const [sellerDeliveryPay, setSellerDeliveryPay] = useState(0);
    const [deliverPriceMode, setDeliverPriceMode] = useState(Mode.USD);
    // const [buyerEscrow, setBuyerEscrow] = useState(0);
    // const [sellerEscrow, setSellerEscrow] = useState(0);
    // const [deliverEscrow, setDeliverEscrow] = useState(0);
    // const [dateDelay, setDateDelay] = useState(new Date());

    return (
        <Row className="justify-content-md-center mt-5">
            <Col className="col-sm-5">
                <Card className="text-center">
                    <Card.Header>
                        Create Order
                    </Card.Header>
                    <Card.Body>
                        <Form onReset={handleReset} onSubmit={handleSubmit}>
                            {/*<AccountInfo*/}
                            {/*    account={buyer}*/}
                            {/*    actor={"buyer"}*/}
                            {/*    onChange={(value) => setBuyer(value)}*/}
                            {/*/>*/}
                            {/*<AccountInfo*/}
                            {/*    account={seller}*/}
                            {/*    actor={"seller"}*/}
                            {/*    onChange={(value) => setSeller(value)}*/}
                            {/*/>*/}
                            {/*<AccountInfo*/}
                            {/*    account={deliver}*/}
                            {/*    actor={"deliver"}*/}
                            {/*    onChange={(value) => setDeliver(value)}*/}
                            {/*/>*/}
                            <EtherInput
                                currencyPrice={0.5}
                                label={"Seller price"}
                                setFieldValue={setFieldValue}
                                name={"sellerPrice"}
                                touched={touched}
                                errors={errors}
                            />
                            {/*<EtherInput*/}
                            {/*    currencyPrice={0.5}*/}
                            {/*    label={"Deliver price"}*/}
                            {/*    setFieldValue={setFieldValue}*/}
                            {/*    onChangeMode={(mode) => setDeliverPriceMode(mode)}*/}
                            {/*/>*/}
                            {/*{deliverPrice > 0 ?*/}
                            {/*    <SellerDeliveryPay*/}
                            {/*        deliveryCost={deliverPrice}*/}
                            {/*        onChange={(value) => setSellerDeliveryPay(value)}*/}
                            {/*        currencyMode={deliverPriceMode}*/}
                            {/*        currencyPrice={0.5}*/}
                            {/*    />*/}
                            {/*    : ""}*/}
                            {/*<DelayPicker onChange={(value) => setDateDelay(value)}/>*/}
                            {/*<EscrowInput*/}
                            {/*    simpleEscrowValue={deliverPrice + sellerPrice}*/}
                            {/*    currencyPrice={0.5}*/}
                            {/*    onChangeBuyer={(value) => setBuyerEscrow(value)}*/}
                            {/*    onChangeSeller={(value) => setSellerEscrow(value)}*/}
                            {/*    onChangeDeliver={(value) => setDeliverEscrow(value)}*/}
                            {/*/>*/}
                            <Button type="submit" disabled={isSubmitting}>
                                Create
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
};

const CreateOrder = withFormik<FormProps, FormValues>({
    // Transform outer props into form values
    // mapPropsToValues: props => {
    mapPropsToValues: () => {
        return {
            buyer: '',
            seller: '',
            deliver: '',
            sellerPrice: 0.0,
            deliverPrice: 0.0,
            sellerDeliveryPay: 0.0,
            buyerEscrow: 0.0,
            sellerEscrow: 0.0,
            deliverEscrow: 0.0,
            dateDelay: new Date()
        };
    },

    // Add a custom validation function (this can be async too!)
    validate: (values: FormValues) => {
        let errors: FormikErrors<FormErrors> = {};
        if (!values.sellerPrice) {
            errors.sellerPrice = 'Required';
        } else if (values.sellerPrice < 0) {
            errors.sellerPrice = "Price can't be negative";
        }
        return errors;
    },

    handleSubmit: (values, {setSubmitting}) => {
        setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            setSubmitting(false);
        }, 1000);
        console.log(values)
    },
})(CreateForm);

export default CreateOrder;