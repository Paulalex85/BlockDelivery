import React, {useEffect, useState} from 'react';
import {Button} from 'react-bootstrap'
import {useSelector} from "react-redux";
import {getUserAddress} from "../../../../redux/selectors";
import {createEthersContract} from "../../../../utils/createEthersContract";
import {hashOrderData, signData} from "../../../../utils/KeyGenerator";
import {keccak256} from "ethers/lib/utils";
import {BigNumber} from "ethers";

type Props = {
    orderId: number
    orderData: any;
    escrowData: any;
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

    const getValueToPay = () => {
        if (address === props.orderData.buyer && !props.orderData.buyerValidation) {
            return props.orderData.deliverPrice.add(props.orderData.sellerPrice).add(props.escrowData.escrowBuyer);
        } else if (address === props.orderData.seller && !props.orderData.sellerValidation) {
            return props.escrowData.escrowSeller;
        } else if (address === props.orderData.deliver && !props.orderData.deliverValidation) {
            return props.escrowData.escrowDeliver;
        }
        return BigNumber.from(0);
    };

    const handleClick = () => {
        createEthersContract(props.userProvider).then((contract) => {
            let contractWithSigner = contract.connect(props.userProvider.getSigner());
            let hash = hashOrderData(props.orderId, props.orderData, props.escrowData);
            signData(address, props.userProvider, hash).then(signedHash => {
                if (signedHash !== undefined) {
                    contractWithSigner.validateOrder(props.orderId, keccak256(signedHash), {value: getValueToPay()}).then((tx: any) => {
                        console.log(tx);
                    }, (e: any) => {
                        console.log("Unable to send the transaction", e);
                    });
                }
            }, (e: any) => {
                console.log("Unable to sign data", e);
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