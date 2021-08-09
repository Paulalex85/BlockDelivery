import { SET_ADDRESS, SET_WITHDRAW_BALANCE } from '../actionTypes';
import { BigNumber } from 'ethers';

const initialState = {
    address: '',
    withdrawBalance: BigNumber.from(0),
};

export default function (state = initialState, action: any) {
    switch (action.type) {
        case SET_ADDRESS: {
            const address = action.payload;
            return {
                ...state,
                address: address,
            };
        }
        case SET_WITHDRAW_BALANCE: {
            const withdraw = action.value;
            return {
                ...state,
                withdrawBalance: withdraw,
            };
        }
        default:
            return state;
    }
}
