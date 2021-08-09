import { BigNumber } from 'ethers';

export const getUserState = (store: { user: any }) => store.user;

export const getUserAddress = (store: any) => (getUserState(store) ? getUserState(store).address : '');
export const getWithdrawBalance = (store: any) =>
    getUserState(store) ? getUserState(store).withdrawBalance : BigNumber.from(0);
