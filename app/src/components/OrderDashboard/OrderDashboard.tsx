import React, {useEffect, useState} from 'react';
// Components
import {NewOrder} from './components';
import {ListGroup} from 'react-bootstrap';
import {useSelector} from "react-redux";
import {getUserAddress} from "../../redux/selectors";
import {createEthersContract} from "../../utils/createEthersContract";
import OrderElement from "./components/OrderElement";

type Props = {
    userProvider: any;
}

const OrderDashboard = (props: Props) => {
    const [orders, setOrders] = useState([<OrderElement orderId={-1}/>]);
    let userAddress = useSelector(getUserAddress);

    useEffect(() => {
        if (userAddress) {
            createEthersContract(props.userProvider).then((contract) => {
                let orderFilter = contract.filters.NewOrder();
                contract.queryFilter(orderFilter).then((result) => {
                    let listOrderId: number[] = [];
                    result.forEach(x => {
                        if (x.args !== undefined && x.args.orderId !== undefined) {
                            listOrderId.push(x.args.orderId.toNumber());
                        }
                    });
                    console.log("listOrderId : " + listOrderId);
                    setOrders(listOrderId.map(id => (
                        <OrderElement
                            orderId={id}
                            key={id.toString()}
                        />
                    )));
                })
            });
        }
    }, [userAddress, props.userProvider]);

    return (
        <div>
            <NewOrder/>
            <ListGroup className="align-items-center">
                {orders}
            </ListGroup>
        </div>
    )
};

export default OrderDashboard;