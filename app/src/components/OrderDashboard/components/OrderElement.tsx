import React, {useEffect, useState} from 'react';
import {createEthersContract} from "../../../utils/createEthersContract";
import {ListGroup} from 'react-bootstrap';
import {BsChevronUp, BsChevronDown} from "react-icons/bs";

type Props = {
    orderId: any;
    userProvider: any;
}

const OrderElement = (props: Props) => {
    const [orderData, setOrderData] = useState<any>();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [colorListGroup, setColorListGroup] = useState("");
    useEffect(() => {
        createEthersContract(props.userProvider).then((contract) => {
            contract.getOrder(props.orderId).then((result: any) => {
                console.log(result);
                setOrderData(result)
            })
        });
    }, [props.userProvider]);

    useEffect(() => {
        if (orderData !== undefined && orderData.orderStage !== undefined) {
            switch (orderData.orderStage) {
                case "0":
                    setTitle("Order initialization");
                    break;
            }
        }
    }, [orderData]);

    return (
        <ListGroup.Item
            action
            variant={colorListGroup}
            className="text-center"
            onClick={() => setOpen(!open)}
            aria-controls="collapse-order"
            aria-expanded={open}>
                    <span className="float-left">
                        Order #{props.orderId}
                    </span>
            <span>
                        {title}
                    </span>
            {open ?
                <BsChevronUp/>
                :
                <BsChevronDown/>
            }
        </ListGroup.Item>
    )
};

export default OrderElement;
