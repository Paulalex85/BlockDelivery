import { BigNumber } from 'ethers';

export const getUserState = (store: { user: any }) => store.user;

export const getUserAddress = (store: any): string => (getUserState(store) ? getUserState(store).address : '');
export const getWithdrawBalance = (store: any): BigNumber =>
    getUserState(store) ? getUserState(store).withdrawBalance : BigNumber.from(0);
