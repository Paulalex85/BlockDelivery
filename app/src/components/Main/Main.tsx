import React, {useState} from "react";
import {BrowserRouter, Route} from "react-router-dom";
import {Menu} from './components';
import LandingPage from "../LandingPage";
import CreateOrder from "../CreateOrder";
import {useAddress, useUserProvider} from "../../hooks";
import {ethers} from "ethers";

const Main = () => {
    const mainnetProvider = new ethers.providers.InfuraProvider("mainnet", "2717afb6bf164045b5d5468031b93f87");
    const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : "http://localhost:8545");
    const [injectedProvider, setInjectedProvider] = useState();

    const userProvider = useUserProvider(injectedProvider, localProvider);
    useAddress(userProvider);

    return (
        <BrowserRouter>
            <div>
                <Menu
                    userProvider={userProvider}
                    setInjectedProvider={setInjectedProvider}
                    mainnetProvider={mainnetProvider}
                />
                <div>
                    <Route exact path="/" render={(props) => <LandingPage {...props} />}/>
                    <div>
                        <Route path="/create" render={routeProps => (
                            <CreateOrder
                                userProvider={userProvider}
                                route={routeProps}/>
                        )}/>

                        {/*<Route path="/orders" component={OrderDashboard}/>*/}
                    </div>
                </div>
            </div>
        </BrowserRouter>
    );
};

export default Main;