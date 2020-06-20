import React, {Component} from "react";
import {BrowserRouter, Route} from "react-router-dom";
import {Menu} from './components';
import LandingPage from "../LandingPage";
import CreateOrder from "../CreateOrder";


class Main extends Component {
    render() {
        return (
            <BrowserRouter>
                <div>
                    <Menu/>
                    <div>
                        <Route exact path="/" render={(props) => <LandingPage {...props} />}/>
                        <div>
                            <Route path="/create" component={CreateOrder}/>
                            {/*<Route path="/orders" component={OrderDashboard}/>*/}
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default Main;