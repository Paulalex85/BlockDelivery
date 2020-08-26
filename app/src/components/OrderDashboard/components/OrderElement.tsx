import React, {useEffect} from 'react';
import {createEthersContract} from "../../../utils/createEthersContract";
// import Octicon, {getIconByName} from '@githubprimer/octicons-react';

type Props = {
    orderId: any;
    userProvider: any;
}

const OrderElement = (props: Props) => {

    useEffect(() => {
        createEthersContract(props.userProvider).then((contract) => {
            contract.getOrder(props.orderId).then((result: any) => {
                console.log(result)
            })
        });
    }, [props.userProvider]);

    return (
        <div>
            Order #{props.orderId}
        </div>
    )
};

export default OrderElement;
