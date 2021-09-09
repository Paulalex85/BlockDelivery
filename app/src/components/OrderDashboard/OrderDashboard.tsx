import React, { useEffect, useState } from 'react';
// Components
import { NewOrder } from './components';
import { ListGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../redux/selectors';
import { createEthersContract } from '../../utils/createEthersContract';
import OrderElement from './components/OrderElement';
import { RouteComponentProps } from 'react-router-dom';
import WithdrawBalance from './components/WithdrawBalance';

type Props = {
    userProvider: any;
    route: RouteComponentProps;
};

const OrderDashboard = (props: Props) => {
    const [orders, setOrders] = useState<any>([]);
    const userAddress = useSelector(getUserAddress);

    useEffect(() => {
        if (userAddress) {
            createEthersContract(props.userProvider).then((contract) => {
                const orderFilter = contract.filters.NewOrder();
                contract.queryFilter(orderFilter).then((result) => {
                    const listOrderId: number[] = [];
                    result.forEach((x) => {
                        if (x.args !== undefined && x.args.orderId !== undefined) {
                            listOrderId.push(x.args.orderId.toNumber());
                        }
                    });
                    console.log('listOrderId : ' + listOrderId);
                    setOrders(
                        listOrderId.map((id) => (
                            <OrderElement
                                userProvider={props.userProvider}
                                orderId={id}
                                key={id.toString()}
                                route={props.route}
                            />
                        )),
                    );
                });
            });
        }
    }, [userAddress, props.userProvider]);

    return (
        <div>
            <NewOrder />
            <WithdrawBalance userProvider={props.userProvider} />
            <ListGroup className="align-items-center">{orders}</ListGroup>
        </div>
    );
};

export default OrderDashboard;
