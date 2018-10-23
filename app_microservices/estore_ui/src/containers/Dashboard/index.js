import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { Spinner } from 'evergreen-ui';
import ConfirmationDialog from 'components/ConfirmationDialog';
import moment from 'moment';
import numeral from 'numeral';


/**
 * Decode hex to string
 * @param {string} hexx
 * @return {string}
 */
function hex2a(hexx) {
  const hex = hexx.toString();

  let str = '';
  for (let i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }

  return str;
}

const POLICY_STATE = {
  0: {
    label: 'Applied',
    actions: [
      {
        method: 'decline', label: 'Decline', intent: 'danger', withDetails: true,
      },
      {
        method: 'underwrite', label: 'Underwrite', intent: 'success',
      },
    ],
  },
  1: {
    label: 'Accepted',
    actions: [
      {
        method: 'expire', label: 'Expire', intent: 'warning',
      },
    ],
  },
  2: {
    label: 'ForPayout',
    actions: [
      {
        method: 'confirmPayout', label: 'Confirm payout', intent: 'success', withDetails: true,
      },
    ],
  },
  3: {
    label: 'PaidOut',
    actions: [],
  },
  4: {
    label: 'Expired',
    actions: [],
  },
  5: {
    label: 'Declined', actions: [],
  },
};

const CLAIM_STATE = {
  0: {
    label: 'Applied',
    actions: [
      {
        method: 'rejectClaim', label: 'Reject', intent: 'danger', withDetails: true,
      },
      {
        method: 'confirmClaim', label: 'Confirm', intent: 'warning', withDetails: true,
      },
    ],
  },
  1: {
    label: 'Rejected',
    actions: [],
  },
  2: {
    label: 'Confirmed',
    actions: [],
  },
};

const POLICY_CURRENCY = {
  0: 'EUR',
  1: 'USD',
  2: 'GBP',
};

const Article = styled.div`
  height: 100%;
  display: flex;
  padding: 60px 0 0 0;
  position: relative;
`;


const Column = styled.div`
  width: 50%;
  background: #ffebcd;
  border-left: 1px solid #dcc19e;
  height: 100%;
  overflow-y: scroll;
  position: relative;
`;

const Title = styled.div`
  background: #f2d4af;
  font-weight: bold;
  padding: 20px;
  position: fixed;
  width: 100%;
  z-index: 1;
`;

const List = styled.div`
  margin-top: 80px;
`;

const Item = styled.div`
  background: #fff;
  padding: 15px;
  margin: 20px;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,0.12);
  border-radius: 3px;
`;

const Actions = styled.div`
  margin-top: 20px;
  display: flex;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
`;

class Dashboard extends Component {
  state = {
    policies: [],
    claims: [],
    loadingPolicies: true,
    loadingClaims: true,
  };

  componentDidMount() {
    this.loadPolicies();
    this.loadClaims();
  }

  loadPolicies() {
    if (window.socket && window.socket.isOpened) {
      this.props.request('getPolicies')
        .then(data => this.setState({ policies: data.policies, loadingPolicies: false }))
        .catch(console.error);
    } else {
      console.log('wait');
      setTimeout(() => this.loadPolicies(), 100);
    }
  }

  loadClaims() {
    if (window.socket && window.socket.isOpened) {
      this.props.request('getClaims')
        .then(data => this.setState({ claims: data.claims, loadingClaims: false }))
        .catch(console.error);
    } else {
      console.log('wait');
      setTimeout(() => this.loadClaims(), 100);
    }
  }

  updateAfterTransaction = (data) => {
    if (data.policy) {
      const index = this.state.policies.findIndex(policy => policy.policyId === data.policy.policyId);

      const policies = [
        ...this.state.policies.slice(0, index),
        data.policy,
        ...this.state.policies.slice(index + 1),
      ];

      this.setState({ policies: [...policies] });
    }

    if (data.claim) {
      const index = this.state.claims.findIndex(claim => claim.claimId === data.claim.claimId);

      const claims = [
        ...this.state.claims.slice(0, index),
        data.claim,
        ...this.state.claims.slice(index + 1),
      ];

      this.setState({ claims: [...claims] });
    }
  };

  render() {
    const policies = this.state.policies.map(policy => (
      <Item key={policy.policyId}>
        <div><b>{hex2a(policy.product)}</b></div>
        <div>Policy ID: {policy.policyId}
        </div>
        <div>State: {POLICY_STATE[policy.state].label}
        </div>
        <div>State message: {hex2a(policy.stateMessage)}
        </div>
        <div>Last update: {moment.unix(policy.stateTime).utc().format('YYYY-MM-DD HH:mm:ss')}
        </div>
        <div>Premium: {numeral(policy.premium / 100).format('0,0.00')}
        </div>

        {POLICY_STATE[policy.state].actions.length > 0 && (
          <Actions>
            {POLICY_STATE[policy.state].actions.map((action, i) => (
              <ConfirmationDialog
                key={i}
                action={action.method}
                label={action.label}
                intent={action.intent || 'success'}
                request={this.props.request}
                withDetails={action.withDetails || false}
                id={policy.policyId}
                updateAfterTransaction={this.updateAfterTransaction}
              />
            ))}
          </Actions>
        )}
      </Item>
    ));

    const claims = this.state.claims.map((claim, i) => (
      <Item key={i}>
        <div>
          <b>Claim ID: {claim.claimId}
          </b>
        </div>
        <div>Policy ID: {claim.policyId}
        </div>
        <div>State: {CLAIM_STATE[claim.state].label}
        </div>
        <div>State message: {hex2a(claim.stateMessage)}
        </div>
        <div>Last update: {moment.unix(claim.stateTime).utc().format('YYYY-MM-DD HH:mm:ss')}
        </div>

        {CLAIM_STATE[claim.state].actions.length > 0 && (
          <Actions>
            {CLAIM_STATE[claim.state].actions.map((action, i) => (
              <ConfirmationDialog
                key={i}
                action={action.method}
                label={action.label}
                intent={action.intent || 'success'}
                request={this.props.request}
                withDetails={action.withDetails || false}
                id={claim.claimId}
                updateAfterTransaction={this.updateAfterTransaction}
              />
            ))}
          </Actions>
        )}
      </Item>
    ));

    return (
      <Article>
        <Helmet>
          <title>Dashboard</title>
        </Helmet>

        <Column>
          <Title>Policies</Title>

          <List>
            {this.state.loadingPolicies && <SpinnerWrapper><Spinner /></SpinnerWrapper>}
            {!this.state.loadingPolicies && policies}
          </List>
        </Column>

        <Column>
          <Title>Claims</Title>
          <List>
            {this.state.loadingClaims && <SpinnerWrapper><Spinner /></SpinnerWrapper>}
            {!this.state.loadingPolicies && claims}
          </List>
        </Column>
      </Article>
    );
  }
}

export default Dashboard;
