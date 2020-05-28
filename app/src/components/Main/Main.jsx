import React, {Component} from "react";
import {BrowserRouter, Route} from "react-router-dom";
import {Menu} from './components';
import LandingPage from "../LandingPage";


class Main extends Component {
    render() {
        let activeUser = this.props.drizzleState.accounts !== undefined && this.props.drizzleState.accounts.length > 0;
        return (
            <BrowserRouter>
                <div>
                    <Menu drizzle={this.props.drizzle}
                          drizzleState={this.props.drizzleState}/>
                    <div>
                        <Route exact path="/" render={(props) => <LandingPage drizzle={this.props.drizzle}
                                                                              drizzleState={this.props.drizzleState} {...props} />}/>
                        {activeUser &&
                        <div>
                            {/*<Route path="/orders" component={OrderDashboard}/>*/}
                            {/*<Route path="/create" component={CreateOrder}/>*/}
                        </div>
                        }
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default Main;