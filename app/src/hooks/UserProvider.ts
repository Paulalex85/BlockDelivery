import { useMemo } from 'react';
import { providers } from 'ethers';
import BurnerProvider from 'burner-provider';
import { INFURA_ID } from '../constants';

export const useUserProvider = (injectedProvider: any, localProvider: any) =>
    useMemo(() => {
        if (injectedProvider) {
            console.log('Using injected provider');
            return injectedProvider;
        } else if (!localProvider) return undefined;
        else if (localProvider.connection && localProvider.connection.url) {
            console.log('Using burner provider');
            return new providers.Web3Provider(new BurnerProvider(localProvider.connection.url));
        }
        const networkName = localProvider._network && localProvider._network.name;
        return new providers.Web3Provider(
            new BurnerProvider(`https://${networkName || 'mainnet'}.infura.io/v3/${INFURA_ID}`),
        );
    }, [injectedProvider, localProvider]);
