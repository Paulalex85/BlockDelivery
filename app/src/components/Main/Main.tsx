import React, { useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Menu } from './components';
import LandingPage from '../LandingPage';
import CreateUpdateOrder from '../CreateOrder';
import { providers } from 'ethers';
import OrderDashboard from '../OrderDashboard';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { useAddress, useUserProvider } from '../../hooks';
import { NETWORKS } from '../../constants';

const Main = () => {
    // const mainnetProvider = new ethers.providers.InfuraProvider('mainnet', '2717afb6bf164045b5d5468031b93f87');
    const cachedNetwork = window.localStorage.getItem('network');
    const targetNetwork = NETWORKS[cachedNetwork !== null ? cachedNetwork : 'ropsten'];
    const localProvider: StaticJsonRpcProvider = new providers.JsonRpcProvider(
        targetNetwork !== undefined ? targetNetwork.rpcUrl : 'http://localhost:8545',
    );
    const [injectedProvider, setInjectedProvider] = useState<providers.Web3Provider>();

    const userProvider: providers.Web3Provider = useUserProvider(injectedProvider, localProvider);
    useAddress(userProvider);

    return (
        <BrowserRouter>
            <div>
                <Menu userProvider={userProvider} setInjectedProvider={setInjectedProvider} />
                <div>
                    <Route exact path="/" render={(props) => <LandingPage {...props} />} />
                    <div>
                        <Route
                            path="/create"
                            render={(routeProps) => (
                                <CreateUpdateOrder userProvider={userProvider} route={routeProps} />
                            )}
                        />

                        <Route
                            path="/update/:id"
                            render={(routeProps) => (
                                <CreateUpdateOrder userProvider={userProvider} route={routeProps} />
                            )}
                        />

                        <Route
                            path="/orders"
                            render={(routeProps) => <OrderDashboard userProvider={userProvider} route={routeProps} />}
                        />
                    </div>
                </div>
            </div>
        </BrowserRouter>
    );
};

export default Main;
