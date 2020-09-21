import React, {useEffect, useState} from 'react';
import {Button} from 'react-bootstrap'

type Props = {
    orderData: any;
    escrowData: any;
    orderId: number;
    route: any;
}

const UpdateOrder = (props: Props) => {
    const [canUpdate, setCanUpdate] = useState(false);

    useEffect(() => {
        if (props.orderData.orderStage === 0) {
            setCanUpdate(true);
        }
    }, [props.orderData]);

    const handleClick = () => {
        props.route.history.push("/update/" + props.orderId, {data: {...props.orderData, ...props.escrowData}});
    };

    return (
        <div>
            {canUpdate &&
            <Button
                onClick={handleClick}
                variant='primary'
            >
                UPDATE
            </Button>
            }
        </div>
    );
};

export default UpdateOrder;