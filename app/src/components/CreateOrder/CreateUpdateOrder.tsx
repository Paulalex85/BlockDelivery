import React, {useState} from 'react';
import {Button, Card, Col, Form as BootstrapForm, Row} from 'react-bootstrap';
import {AccountInfo, DelayPicker, EscrowInput, EtherInput, SellerDeliveryPay} from "./components";
import {Mode} from "./components/EtherInput";
import {Form as FormikForm, FormikErrors, FormikProps, withFormik} from "formik"
import {createEthersContract} from "../../utils/createEthersContract";
import {BigNumber} from "ethers";

type CreateUpdateOrderProps = {
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

const CreateForm = (props: CreateUpdateOrderProps & FormikProps<FormValues>) => {
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
                                    initialValue={props.route.location.state !== undefined ? props.route.location.state.data.buyer : ''}
                                />
                                <AccountInfo
                                    setFieldValue={setFieldValue}
                                    name={"seller"}
                                    errors={errors}
                                    initialValue={props.route.location.state !== undefined ? props.route.location.state.data.seller : ''}
                                />
                                <AccountInfo
                                    setFieldValue={setFieldValue}
                                    name={"deliver"}
                                    errors={errors}
                                    initialValue={props.route.location.state !== undefined ? props.route.location.state.data.deliver : ''}
                                />
                                <EtherInput
                                    currencyPrice={0.5}
                                    label={"Seller price"}
                                    setFieldValue={setFieldValue}
                                    name={"sellerPrice"}
                                    errors={errors}
                                    ethBaseValue={props.route.location.state !== undefined ? props.route.location.state.data.sellerPrice.toString() : "0"}
                                />
                                <EtherInput
                                    currencyPrice={0.5}
                                    label={"Deliver price"}
                                    setFieldValue={setFieldValue}
                                    name={"deliverPrice"}
                                    errors={errors}
                                    onChangeMode={(mode) => setDeliverPriceMode(mode)}
                                    ethBaseValue={props.route.location.state !== undefined ? props.route.location.state.data.deliverPrice.toString() : "0"}
                                />
                                {values.deliverPrice !== undefined && values.deliverPrice.gt(0) ?
                                    <SellerDeliveryPay
                                        deliveryCost={values.deliverPrice}
                                        currencyMode={deliverPriceMode}
                                        currencyPrice={0.5}
                                        setFieldValue={setFieldValue}
                                        name={"sellerDeliveryPay"}
                                        initialValue={props.route.location.state !== undefined ? props.route.location.state.data.sellerDeliveryPay.toString() : "0"}
                                    />
                                    : ""}
                                <DelayPicker
                                    setFieldValue={setFieldValue}
                                    name={"dateDelay"}
                                    errors={errors}
                                    initialValue={props.route.location.state !== undefined ? props.route.location.state.data.delayEscrow.toString() : undefined}
                                />
                                <EscrowInput
                                    simpleEscrowValue={values.deliverPrice !== undefined && values.sellerPrice !== undefined ? values.deliverPrice.add(values.sellerPrice).toString() : "0"}
                                    currencyPrice={0.5}
                                    setFieldValue={setFieldValue}
                                    errors={errors}
                                    initialValue={props.route.location.state !== undefined ? props.route.location.state.data : undefined}
                                />
                                <Button type="submit" disabled={isSubmitting}>
                                    {props.route.location.pathname.includes("create") ?
                                        "Create" :
                                        "Update"}
                                </Button>
                            </FormikForm>
                        </BootstrapForm>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
};

const CreateUpdateOrder = withFormik<CreateUpdateOrderProps, FormValues>({
    // Transform outer props into form values
    // mapPropsToValues: props => {
    //     console.log(props.route.match.params);
    //     let orderData = props.route.location.state.orderData;
    // if (props.route.location.pathname.includes("update") && orderData === undefined) {
    //     createEthersContract(props.userProvider).then((contract) => {
    //         contract.getOrder(id).then((orderResult: any) => {
    //             contract.getEscrow(id).then((escrowResult: any) => {
    //                 orderData = {
    //                     ...orderResult,
    //                     ...escrowResult
    //                 }
    //             })
    //         })
    //     })
    // }
    // return {
    //     buyer: orderData.buyer || '',
    //     seller: orderData.seller || '',
    //     deliver: orderData.deliver || '',
    //     sellerPrice: orderData.sellerPrice || BigNumber.from(0),
    //     deliverPrice: orderData.deliverPrice || BigNumber.from(0),
    //     sellerDeliveryPay: orderData.sellerDeliveryPay || BigNumber.from(0),
    //     buyerEscrow: orderData.buyerEscrow || BigNumber.from(0),
    //     sellerEscrow: orderData.sellerEscrow || BigNumber.from(0),
    //     deliverEscrow: orderData.deliverEscrow || BigNumber.from(0),
    //     dateDelay: orderData.dateDelay || new Date()
    // };
    // },

    // Add a custom validation function (this can be async too!)
    validate: (values: FormValues) => {
        const addressErrorMsg = "Define address";
        const priceErrorMsg = 'Required';
        const sameAccountErrorMsg = "The same address can't be used for different roles";
        let errors: FormikErrors<FormErrors> = {};
        if (values.sellerPrice === undefined) {
            errors.sellerPrice = priceErrorMsg;
        }
        if (values.deliverPrice === undefined) {
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

        if (values.buyer === values.seller) {
            errors.buyer = sameAccountErrorMsg;
            errors.seller = sameAccountErrorMsg;
        }
        if (values.buyer === values.deliver) {
            errors.buyer = sameAccountErrorMsg;
            errors.deliver = sameAccountErrorMsg;
        }
        if (values.seller === values.deliver) {
            errors.seller = sameAccountErrorMsg;
            errors.deliver = sameAccountErrorMsg;
        }

        if (values.dateDelay < new Date()) {
            errors.dateDelay = "The date can't be in the past";
        }

        if (values.buyerEscrow === undefined) {
            errors.buyerEscrow = priceErrorMsg;
        }
        if (values.sellerEscrow === undefined) {
            errors.sellerEscrow = priceErrorMsg;
        }
        if (values.deliverEscrow === undefined) {
            errors.deliverEscrow = priceErrorMsg;
        }
        return errors;
    },

    handleSubmit: (values, {props, setSubmitting}) => {
        createEthersContract(props.userProvider).then((contract) => {
            if (contract !== undefined) {
                let contractWithSigner = contract.connect(props.userProvider.getSigner());
                if (props.route.location.pathname.includes("create")) {
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
                        console.log("Unable to send the transaction : ", e);
                        setSubmitting(false);
                    });
                } else {
                    let id = props.route.match.params.id;
                    contractWithSigner.updateInitializeOrder(
                        id,
                        Math.round(values.dateDelay.getTime() / 1000),
                        [values.sellerPrice, values.deliverPrice, values.sellerDeliveryPay, values.buyerEscrow, values.sellerEscrow, values.deliverEscrow]).then((tx: any) => {
                        console.log(tx);
                        setSubmitting(false);
                        props.route.history.push("/orders");
                    }, (e: any) => {
                        console.log("Unable to send the transaction : ", e);
                        setSubmitting(false);
                    });
                }
            } else {
                alert(JSON.stringify("Contract undefined", null, 2));
                setSubmitting(false);
            }
        });
    },
})(CreateForm);

export default CreateUpdateOrder;