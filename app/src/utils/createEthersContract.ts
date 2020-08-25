import DeliveryContract from "../contracts/DeliveryContract.json";
import {ethers} from "ethers";

export const createEthersContract = async (userProvider: any) => {
    const network = await userProvider.getNetwork();
    const contractNetworks: { [k: number]: any } = DeliveryContract.networks;
    const contractAddress = contractNetworks[network.chainId].address;

    return new ethers.Contract(
        contractAddress,
        DeliveryContract.abi,
        userProvider
    );
};