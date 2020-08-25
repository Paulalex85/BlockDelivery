import React from 'react';
// import Octicon, {getIconByName} from '@githubprimer/octicons-react';

type Props = {
    orderId: any;
}

const OrderElement = (props: Props) => {

    return (
        <div>
            Order #{props.orderId}
        </div>
    )
};

export default OrderElement;
