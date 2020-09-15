import React, {useEffect, useState} from 'react';
import {Button} from 'react-bootstrap'

type Props = {
    orderData: any;
}

const UpdateOrder = (props: Props) => {
    const [canUpdate, setCanUpdate] = useState(false);

    useEffect(() => {
        if (props.orderData.orderStage === 0) {
            setCanUpdate(true);
        }
    }, [props.orderData]);

    const handleClick = () => {

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