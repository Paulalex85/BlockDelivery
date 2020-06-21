import {SET_ADDRESS} from "../actionTypes";

const initialState = {
    address: ""
};

export default function (state = initialState, action: any) {
    switch (action.type) {
        case SET_ADDRESS: {
            const address = action.payload;
            return {
                ...state,
                address: address
            };
        }
        default:
            return state;
    }
}