import React, { useEffect, useState } from 'react';
// Components
import { NewOrder } from './components';
import { ListGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getUserAddress } from '../../redux/selectors';
import { createEthersContract } from '../../utils/createEthersContract';
import OrderElement from './components/OrderElement';
import { RouteComponentProps } from 'react-router-dom';
import { usePoller } from '../../hooks';
import { BigNumber } from 'ethers';
import { setWithdrawBalance } from '../../redux/actions';
import { FaEthereum } from 'react-icons/fa';
import { formatEther } from 'ethers/lib/utils';

type Props = {
    userProvider: any;
    route: RouteComponentProps;
};

const OrderDashboard = (props: Props) => {
    const dispatch = useDispatch();
    const [orders, setOrders] = useState<any>([]);
    const [withdraw, setWithdraw] = useState<BigNumber>(BigNumber.from(0));
    const userAddress = useSelector(getUserAddress);

    usePoller(async () => {
        if (userAddress && props.userProvider) {
            createEthersContract(props.userProvider).then((contract) => {
                contract.withdraws(userAddress).then((withdrawValue: BigNumber) => {
                    setWithdraw(withdrawValue);
                    dispatch(setWithdrawBalance(withdrawValue));
                });
            });
        }
    }, 2000);

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
            <h5 className="text-center mb-5">
                Currently in contract : <FaEthereum /> {formatEther(withdraw)}
            </h5>
            <ListGroup className="align-items-center">{orders}</ListGroup>
        </div>
    );
};

export default OrderDashboard;
