import {useMemo} from "react";
import {ethers} from "ethers";
import DeliveryContract from "../contracts/DeliveryContract.json";

export const useContractProvider = (userProvider: any) =>
    useMemo(async () => {
        const network = await userProvider.getNetwork();
        const contractNetworks: { [k: number]: any } = DeliveryContract.networks;
        const contractAddress = contractNetworks[network.chainId].address;

        return new ethers.Contract(
            contractAddress,
            DeliveryContract.abi
        );
    }, [userProvider]);