import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { TextInputField, Button, Spinner } from 'evergreen-ui';


const Article = styled.article`
  width: 900px;
  margin: 0 auto;
  padding: 100px 20px 20px 20px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
`;

class Claim extends Component {
  state = {
    form: {
      policyId: '',
      reason: '',
    },
    loading: false,
    result: false,
  };

  /**
   * Handle application form field change
   * @param {string} field
   * @return {Function}
   */
  handleChange = field => (event) => {
    const { form } = this.state;

    this.setState({ form: { ...form, [field]: event.target.value } });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    this.setState({ loading: true });

    const claim = {
      policyId: this.state.form.policyId,
      reason: this.state.form.reason,
    };

    this.props.request('newClaim', claim)
      .then((result) => {
        console.log(result);

        if (result.data.error) {
          console.log('1');
          this.setState({
            loading: false,
            result: {
              error: result.data.error,
            },
          });
        } else {
          console.log('2');
          this.setState({
            loading: false,
            result: {
              claim: {
                claimId: result.data.events.LogClaimSetState.returnValues._claimId,
                policyId: result.data.events.LogClaimSetState.returnValues._policyId,
              },
            },
          });
        }
      })
      .catch(console.error);
  };

  render() {
    const { form } = this.state;
    const { policyId, reason } = form;


    return (
      <Article>
        <Helmet>
          <title>Claim</title>
        </Helmet>
        <h1>Claim</h1>

        {!this.state.loading && !this.state.result && (
          <form onSubmit={this.handleSubmit}>
            <TextInputField
              label="Policy ID"
              placeholder="Enter ID of policy"
              value={policyId}
              onChange={this.handleChange('policyId')}
              required
            />

            <TextInputField
              label="Reason"
              placeholder="Enter your reason for claim"
              value={reason}
              onChange={this.handleChange('reason')}
              required
            />

            <Button appearance="primary" intent="success" float="right" type="submit">Apply</Button>
          </form>
        )}

        {this.state.loading && !this.state.result && (
          <LoadingWrapper>
            <Spinner />
          </LoadingWrapper>
        )}

        {!this.state.loading && this.state.result && !this.state.result.error && (
          <div>
            <h3>Claim #{this.state.result.claim.claimId} for policy #{this.state.result.claim.policyId} created</h3>
          </div>
        )}

        {!this.state.loading && this.state.result && this.state.result.error && (
          <div>
            <h3>An error has occured: {this.state.result.error}</h3>
          </div>
        )}
      </Article>
    );
  }
}

export default Claim;
