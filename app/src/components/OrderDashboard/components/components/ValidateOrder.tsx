import React, {useEffect, useState} from 'react';
import {Button} from 'react-bootstrap'
import {useSelector} from "react-redux";
import {getUserAddress} from "../../../../redux/selectors";
import {createEthersContract} from "../../../../utils/createEthersContract";

type Props = {
    orderId: number
    orderData: any;
    userProvider: any
}

const ValidateOrder = (props: Props) => {
    const [canValidate, setCanValidate] = useState(false);
    let address = useSelector(getUserAddress);

    useEffect(() => {
        if (props.orderData.orderStage === 0) {
            setCanValidate((address === props.orderData.buyer && !props.orderData.buyerValidation)
                || (address === props.orderData.seller && !props.orderData.sellerValidation)
                || (address === props.orderData.deliver && !props.orderData.deliverValidation));
        }
    }, [props.orderData]);

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            let contractWithSigner = contract.connect(props.userProvider.getSigner());
            contractWithSigner.validateOrder(props.orderId, "0x0").then((tx: any) => {
                console.log(tx);
            }, (e: any) => {
                console.log("Unable to send the transaction : " + e);
            });
        });
    };

    return (
        <div>
            {canValidate &&
            <Button
                onClick={handleClick}
                variant='primary'
            >
                VALIDATE
            </Button>
            }
        </div>
    );
};

export default ValidateOrder;