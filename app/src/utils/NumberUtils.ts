import Big from 'big.js';

export const priceRegex = RegExp('^[0-9]*([,.][0-9]*)?$');
export const negativePriceRegex = RegExp('^-?[0-9]*([,.][0-9]*)?$');

export const bigFromEther = (value: Big): Big => {
    return value.mul(Big(10).pow(18));
};
export const bigToEther = (value: Big): Big => {
    return value.div(Big(10).pow(18));
};
