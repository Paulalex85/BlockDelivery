import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUserAddress } from '../../../../redux/selectors';
import CopyText from '../../../Main/components/Menu/components/CopyText';
import { getSignedKey } from '../../../../utils/KeyGenerator';

type Props = {
    orderId: number;
    orderData: any;
    escrowData: any;
    userProvider: any;
    key: string;
};

const KeyView = (props: Props) => {
    const [shouldDisplayKey, setShouldDisplayKey] = useState(false);
    const [key, setKey] = useState('');
    const address = useSelector(getUserAddress);

    useEffect(() => {
        if (props.orderData.orderStage === 1 && address === props.orderData.seller) {
            console.log(props.key);
            setShouldDisplayKey(true);
            if (key === '' && (props.key === undefined || props.key === '')) {
                getSignedKey(props.orderId, props.orderData, props.escrowData, props.userProvider, address).then(
                    (signedKey) => {
                        setKey(signedKey);
                    },
                );
            }
        }
    }, [props.orderData, props.key]);

    return (
        <React.Fragment>
            {shouldDisplayKey && (
                <React.Fragment>
                    <h5>Key to scan when order pickup</h5>
                    {key}
                    <CopyText value={key} />
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default KeyView;
