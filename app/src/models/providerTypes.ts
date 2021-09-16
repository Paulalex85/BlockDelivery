import { JsonRpcProvider, StaticJsonRpcProvider, Web3Provider, Provider } from '@ethersproject/providers';
import { ethers, Signer } from 'ethers';

export type TEthersProvider = JsonRpcProvider | Web3Provider | StaticJsonRpcProvider;

export type TEthersProviderOrSigner = JsonRpcProvider | Web3Provider | StaticJsonRpcProvider | Signer;

export type TAbstractProvider = Provider;

export type TProviderAndSigner = {
    signer: Signer | undefined;
    provider: TAbstractProvider | undefined;
    providerNetwork: ethers.providers.Network | undefined;
};
