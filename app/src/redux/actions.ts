import {SET_ADDRESS} from "./actionTypes"

export const setUserAddress = (address: string) => ({
    type: SET_ADDRESS,
    payload: address
});