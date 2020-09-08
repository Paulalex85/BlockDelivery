import React, {useState} from 'react';
import {Button, Card, Col, Form as BootstrapForm, Row} from 'react-bootstrap';
import {AccountInfo, DelayPicker, EscrowInput, EtherInput, SellerDeliveryPay} from "./components";
import {Mode} from "./components/EtherInput";
import {Form as FormikForm, FormikErrors, FormikProps, withFormik} from "formik"
import {createEthersContract} from "../../utils/createEthersContract";
import {BigNumber, ethers} from "ethers";

type CreateOrderProps = {
    userProvider: any;
    route: any;
}

export interface FormValues {
    buyer: string;
    seller: string;
    deliver: string;
    sellerPrice: BigNumber;
    deliverPrice: BigNumber;
    sellerDeliveryPay: BigNumber;
    buyerEscrow: BigNumber;
    sellerEscrow: BigNumber;
    deliverEscrow: BigNumber;
    dateDelay: Date;
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
    const {values, errors, isSubmitting, setFieldValue} = props;
    const [deliverPriceMode, setDeliverPriceMode] = useState(Mode.USD);

    // @ts-ignore
    return (
        <Row className="justify-content-md-center mt-5">
            <Col className="col-sm-5">
                <Card className="text-center">
                    <Card.Header>
                        Create Order
                    </Card.Header>
                    <Card.Body>
                        <BootstrapForm>
                            <FormikForm>
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
                                {values.deliverPrice !== undefined && values.deliverPrice.gt(0) ?
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
                                    simpleEscrowValue={values.deliverPrice !== undefined && values.sellerPrice !== undefined ? values.deliverPrice.add(values.sellerPrice) : BigNumber.from(0)}
                                    currencyPrice={0.5}
                                    setFieldValue={setFieldValue}
                                    errors={errors}
                                />
                                <Button type="submit" disabled={isSubmitting}>
                                    Create
                                </Button>
                            </FormikForm>
                        </BootstrapForm>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
};

const CreateOrder = withFormik<CreateOrderProps, FormValues>({
    // Transform outer props into form values
    // mapPropsToValues: props => {
    mapPropsToValues: () => {
        return {
            buyer: '',
            seller: '',
            deliver: '',
            sellerPrice: BigNumber.from(0),
            deliverPrice: BigNumber.from(0),
            sellerDeliveryPay: BigNumber.from(0),
            buyerEscrow: BigNumber.from(0),
            sellerEscrow: BigNumber.from(0),
            deliverEscrow: BigNumber.from(0),
            dateDelay: new Date()
        };
    },

    // Add a custom validation function (this can be async too!)
    validate: (values: FormValues) => {
        const addressErrorMsg = "Define address";
        const priceErrorMsg = 'Required';
        let errors: FormikErrors<FormErrors> = {};
        if (values.sellerPrice !== undefined) {
            errors.sellerPrice = priceErrorMsg;
        }
        if (values.deliverPrice !== undefined) {
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

        if (values.buyerEscrow !== undefined) {
            errors.buyerEscrow = priceErrorMsg;
        }
        if (values.sellerEscrow !== undefined) {
            errors.sellerEscrow = priceErrorMsg;
        }
        if (values.deliverEscrow !== undefined) {
            errors.deliverEscrow = priceErrorMsg;
        }
        return errors;
    },

    handleSubmit: (values, {props, setSubmitting}) => {
        console.log(ethers.utils.formatUnits(BigNumber.from(values.sellerPrice), "wei"));
        console.log(ethers.utils.formatEther(BigNumber.from(values.sellerPrice)));
        createEthersContract(props.userProvider).then((contract) => {
            if (contract !== undefined) {
                let contractWithSigner = contract.connect(props.userProvider.getSigner());
                contractWithSigner.createOrder(
                    [values.buyer, values.seller, values.deliver],
                    values.sellerPrice,
                    values.deliverPrice,
                    values.sellerDeliveryPay,
                    Math.round(values.dateDelay.getTime() / 1000),
                    [values.buyerEscrow, values.sellerEscrow, values.deliverEscrow]).then((tx: any) => {
                    console.log(tx);
                    setSubmitting(false);
                    props.route.history.push("/orders");
                }, (e: any) => {
                    console.log("Unable to send the transaction : " + e);
                    setSubmitting(false);
                });
            } else {
                alert(JSON.stringify("Contract undefined", null, 2));
                setSubmitting(false);
            }
        });
    },
})(CreateForm);

export default CreateOrder;