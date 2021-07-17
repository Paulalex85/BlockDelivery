import { ethers } from 'ethers';
import { arrayify, hexValue, keccak256, toUtf8Bytes } from 'ethers/lib/utils';

export const hashOrderData = (orderId: number, orderData: any, escrowData: any) => {
    const concatData = hexValue(orderId).concat(
        hexValue(orderData.buyer),
        hexValue(orderData.seller),
        hexValue(orderData.deliver),
        hexValue(orderData.sellerPrice),
        hexValue(orderData.deliverPrice),
        hexValue(orderData.sellerDeliveryPay),
        hexValue(escrowData.delayEscrow),
        hexValue(escrowData.escrowBuyer),
        hexValue(escrowData.escrowSeller),
        hexValue(escrowData.escrowDeliver),
    );
    return keccak256(toUtf8Bytes(concatData));
};

export const signData = async (address: string, userProvider: ethers.providers.JsonRpcProvider, data: string) => {
    try {
        return userProvider.getSigner(address).signMessage(arrayify(data));
    } catch (e) {
        console.log(e);
    }
};

export const getSignedKey = async (
    orderId: number,
    orderData: any,
    escrowData: any,
    userProvider: ethers.providers.JsonRpcProvider,
    address: string,
) => {
    const hash = hashOrderData(orderId, orderData, escrowData);
    try {
        const signedKey: string | undefined = await signData(address, userProvider, hash);
        if (signedKey !== undefined) {
            return keccak256(signedKey);
        }
    } catch (e) {
        console.log('Unable to sign data', e);
    }
    return '';
};
