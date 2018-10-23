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

/**
 * Claim request page
 */
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

  /**
   * Submit claim request form
   * @param {event} e
   */
  handleSubmit = (e) => {
    const { form } = this.state;
    const { request } = this.props;

    e.preventDefault();

    this.setState({ loading: true });

    const claim = {
      policyId: form.policyId,
      reason: form.reason,
    };

    request('newClaim', claim)
      .then((result) => {
        if (result.data.error) {
          this.setState({
            loading: false,
            result: {
              error: result.data.error,
            },
          });
        } else {
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

  newClaim = () => this.setState({ result: false });

  render() {
    const { form, loading, result } = this.state;
    const { policyId, reason } = form;


    return (
      <Article>
        <Helmet>
          <title>Claim</title>
        </Helmet>
        <h1>Claim</h1>

        {!loading && !result && (
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

        {loading && !result && (
          <LoadingWrapper>
            <Spinner />
          </LoadingWrapper>
        )}

        {!loading && result && !result.error && (
          <div>
            <h3>
              Claim # {result.claim.claimId} for policy #{result.claim.policyId} created
            </h3>
            <Button appearance="primary" intent="success" onClick={this.newClaim}>Add new claim</Button>
          </div>
        )}

        {!loading && result && result.error && (
          <div>
            <h3>An error has occured: {result.error}</h3>
            <Button appearance="primary" intent="success" onClick={this.newClaim}>Add new claim</Button>
          </div>
        )}
      </Article>
    );
  }
}

export default Claim;
