import { SET_ADDRESS, SET_WITHDRAW_BALANCE } from './actionTypes';
import { BigNumber } from 'ethers';

export const setUserAddress = (address: string) => ({
    type: SET_ADDRESS,
    payload: address,
});

export const setWithdrawBalance = (withdraw: BigNumber) => ({
    type: SET_WITHDRAW_BALANCE,
    value: withdraw,
});
