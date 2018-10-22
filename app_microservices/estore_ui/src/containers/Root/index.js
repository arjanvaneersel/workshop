import 'sanitize.css/sanitize.css';

import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import WebSocketAsPromised from 'websocket-as-promised';

// Components
import Header from 'components/Header';
import Console from 'components/Console';

// Pages
import Catalog from 'containers/Catalog';
import Checkout from 'containers/Checkout';
import Claim from 'containers/Claim';
import Dashboard from 'containers/Dashboard';
import NotFound from 'containers/NotFound';

import GlobalStyles from './global-styles';


const Layout = styled.div`
  display: flex;
  height: 100%;
  width: 70%;
`;

const Content = styled.div`
  flex-grow: 1;
  height: 100%;
`;

const Page = styled.div`
  height: 100%;
`;


class Root extends Component {
  state = {
    logs: [],
  };

  cleanLogs = () => this.setState({ logs: [] });

  pushLog(msg) {
    this.setState({ logs: [msg, ...this.state.logs]});
  }

  componentDidMount() {
    this.openWs();
  }

  openWs() {
    const wsp = new WebSocketAsPromised(`${window.location.origin.replace(/^http/, 'ws')}/api/ws`, {
      packMessage: data => JSON.stringify(data),
      unpackMessage: message => JSON.parse(message),
      attachRequestId: (data, requestId) => Object.assign({id: requestId}, data),
      extractRequestId: data => data && data.id,
    });

    wsp.getUniqueID = () => {
      const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

      return `${s4()}${s4()}-${s4()}`;
    };

    wsp.open()
      .then(() => {
        window.socket = wsp;
      })
      .catch(e => console.error(e));

    wsp.onError.addListener(console.error);
    wsp.onClose.addListener(() => this.pushLog(JSON.stringify({ app: 'UI', msg: 'WS connection closed' })));
    wsp.onMessage.addListener(msg => {
      console.log(msg);
      this.pushLog(msg);
    });
  }

  request = (type, data) => {
    if (!window.socket) {
      return Promise.reject();
    }

    return window.socket.sendRequest({ type, data }, {requestId: window.socket.getUniqueID()});
  };

  render() {
    return (
      <Router>
        <Layout>
          <Helmet
            titleTemplate="%s - eStore"
            defaultTitle="eStore"
          >
            <meta name="description" content="Electronic store" />
          </Helmet>
          <GlobalStyles />

          <Content>
            <Header />

            <Page>
              <Switch>
                <Route exact path="/" component={Catalog} />
                <Route exact path="/checkout/:vendorCode" render={props => <Checkout request={this.request} {...props} />} />
                <Route exact path="/claim" render={() => <Claim request={this.request} />} />
                <Route exact path="/dashboard" render={() => <Dashboard request={this.request} />} />
                <Route path="" component={NotFound} />
              </Switch>
            </Page>
          </Content>

          <Console logs={this.state.logs} />
        </Layout>
      </Router>
    );
  }
}

export default Root;
