import React, {useState} from 'react';
import {Card, Col, Row, Form, Button} from 'react-bootstrap';
import {AccountInfo, DelayPicker, EscrowInput, EtherInput, SellerDeliveryPay} from "./components";
import {Mode} from "./components/EtherInput";
import {FormikErrors, FormikProps, withFormik} from "formik"
import DeliveryContract from "../../contracts/DeliveryContract.json"

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
    deliverPrice: string;
    buyer: string;
    seller: string;
    deliver: string;
    dateDelay: string;
    buyerEscrow: string;
    sellerEscrow: string;
    deliverEscrow: string;
}

const CreateForm = (props: CreateOrderProps & FormikProps<FormValues>) => {
    const {values, errors, isSubmitting, handleReset, handleSubmit, setFieldValue} = props;

    const [deliverPriceMode, setDeliverPriceMode] = useState(Mode.USD);


    // const deployedNetwork = DeliveryContract.networks[networkId];
    // const instance = new web3.eth.Contract(
    //     SimpleStorageContract.abi,
    //     deployedNetwork && deployedNetwork.address,
    // );
    console.log(DeliveryContract);

    // @ts-ignore
    return (
        <Row className="justify-content-md-center mt-5">
            <Col className="col-sm-5">
                <Card className="text-center">
                    <Card.Header>
                        Create Order
                    </Card.Header>
                    <Card.Body>
                        <Form onReset={handleReset} onSubmit={() => handleSubmit}>
                            <AccountInfo
                                setFieldValue={setFieldValue}
                                name={"buyer"}
                                errors={errors}
                            />
                            <AccountInfo
                                setFieldValue={setFieldValue}
                                name={"seller"}
                                errors={errors}
                            />
                            <AccountInfo
                                setFieldValue={setFieldValue}
                                name={"deliver"}
                                errors={errors}
                            />
                            <EtherInput
                                currencyPrice={0.5}
                                label={"Seller price"}
                                setFieldValue={setFieldValue}
                                name={"sellerPrice"}
                                errors={errors}
                            />
                            <EtherInput
                                currencyPrice={0.5}
                                label={"Deliver price"}
                                setFieldValue={setFieldValue}
                                name={"deliverPrice"}
                                errors={errors}
                                onChangeMode={(mode) => setDeliverPriceMode(mode)}
                            />
                            {values.deliverPrice > 0 ?
                                <SellerDeliveryPay
                                    deliveryCost={values.deliverPrice}
                                    currencyMode={deliverPriceMode}
                                    currencyPrice={0.5}
                                    setFieldValue={setFieldValue}
                                    name={"sellerDeliveryPay"}
                                />
                                : ""}
                            <DelayPicker
                                setFieldValue={setFieldValue}
                                name={"dateDelay"}
                                errors={errors}
                            />
                            <EscrowInput
                                simpleEscrowValue={values.deliverPrice + values.sellerPrice}
                                currencyPrice={0.5}
                                setFieldValue={setFieldValue}
                                errors={errors}
                            />
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
        const addressErrorMsg = "Define address";
        const priceErrorMsg = 'Required';
        let errors: FormikErrors<FormErrors> = {};
        if (isNaN(values.sellerPrice)) {
            errors.sellerPrice = priceErrorMsg;
        }
        if (isNaN(values.deliverPrice)) {
            errors.deliverPrice = priceErrorMsg;
        }

        if (!values.buyer) {
            errors.buyer = addressErrorMsg;
        }
        if (!values.seller) {
            errors.seller = addressErrorMsg;
        }
        if (!values.deliver) {
            errors.deliver = addressErrorMsg;
        }

        if (values.dateDelay < new Date()) {
            errors.dateDelay = "The date can't be in the past";
        }

        if (isNaN(values.buyerEscrow)) {
            errors.buyerEscrow = priceErrorMsg;
        }
        if (isNaN(values.sellerEscrow)) {
            errors.sellerEscrow = priceErrorMsg;
        }
        if (isNaN(values.deliverEscrow)) {
            errors.deliverEscrow = priceErrorMsg;
        }
        return errors;
    },

    handleSubmit: (values, {setSubmitting}) => {
        setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            setSubmitting(false);
        }, 1000);
    },
})(CreateForm);

export default CreateOrder;