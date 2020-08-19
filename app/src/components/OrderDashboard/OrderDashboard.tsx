import React from 'react';
// Components
import {NewOrder} from './components';

type Props = {
    userProvider: any;
    contract: any;
}

const OrderDashboard = (props: Props) => {

    // const Orders = listOrders.map(order => (
    //     <OrderElement
    //         order={order}
    //         key={order.orderKey}
    //     />
    // ));

    return (
        <div>
            <NewOrder/>
            {/*<ListGroup className="align-items-center">*/}
            {/*    {Orders}*/}
            {/*</ListGroup>*/}
        </div>
    )
};

export default OrderDashboard;