import {useCallback, useEffect, useState} from "react";
import {usePoller} from "./Poller";
import {useDispatch} from "react-redux";
import {setUserAddress} from "../redux/actions";

export const useAddress = (provider: any) => {
    const dispatch = useDispatch();
    const [address, setAddress] = useState("");

    const getAddress = useCallback(async (prov: any) => {
        console.log("Retrieve address ...");
        if (prov) {
            const accounts = await prov.listAccounts();
            if (accounts && accounts[0] && accounts[0] !== address) {
                setAddress(accounts[0]);
                console.log("Current address : " + accounts[0]);
                dispatch(setUserAddress(accounts[0]));
            }
        }
    }, []);

    useEffect(() => {
        getAddress(provider).then(() => {
            return address;
        });
    }, [provider]);
    return address;
};