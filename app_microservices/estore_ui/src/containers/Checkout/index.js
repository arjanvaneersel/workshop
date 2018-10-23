import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { Spinner } from 'evergreen-ui';
import { StripeProvider, Elements } from 'react-stripe-elements';
import products from 'products.json';
import numeral from 'numeral';
import CardForm from './form';


const Article = styled.article`
  padding: 100px 20px 20px;
  width: 900px;
  margin: 0 auto;
`;

const Product = styled.div`
  display: flex;
`;

const Details = styled.div`
  flex-glow: 1;
  padding-left: 20px;
`;

const CheckoutForm = styled.div`
  padding: 20px;
  border: 2px solid #39a065;
  background: #fff;
  margin-top: 30px;
  border-radius: 4px;
`;

const Option = styled.div`
  margin-bottom: 8px;
  
  span {
    margin-left: 10px;
  }
`;

const Purchase = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
`;


class Checkout extends Component {
  state = {
    insurance: 0,
    insuranceOptions: [
      { label: 'No', price: 0 },
      { label: '1 year', price: 10 },
      { label: '2 year', price: 15 },
      { label: '3 year', price: 20 },
    ],
    product: products.find(p => p.vendorCode === this.props.match.params.vendorCode),

    loading: false,

    purchase: null,
  };

  getTotal(value) {
    const price = Number(value);
    const { insuranceOptions, insurance } = this.state;

    const total = price * (1 + insuranceOptions[insurance].price / 100);

    return numeral(total).format('0,0.00');
  }

  setInsurance = insurance => () => this.setState({ insurance });

  handleSubmit = (data) => {
    // console.log(data, this.getTotal(this.state.product.price));

    this.setState({loading: true});

    if (this.state.insurance) {
      const input = {
        customer: {
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
        },
        policy: {
          distributorId: '11111111-1111-1111-1111-111111111111',
          vendorCode: this.state.product.vendorCode,
          product: this.state.product.product,
          premium: this.state.product.price * this.state.insuranceOptions[this.state.insurance].price,
          sumInsured: this.state.product.price,
          currency: this.state.product.currency,
          expiration: this.state.insuranceOptions[this.state.insurance].label,
        },
      };

      this.props.request('newPolicy', input)
        .then((result) => {
          console.log(result);
          this.setState({
            loading: false,
            purchase: {
              product: {
                vendorCode: this.state.product.vendorCode,
                product: this.state.product.product,
              },
              policy: {
                id: result.data.events.LogPolicySetState.returnValues._policyId,
                transactionHash: result.data.transactionHash,
              },
            },
          });
        });
    } else {
      this.setState({
        loading: false,
        purchase: {
          product: {
            vendorCode: this.state.product.vendorCode,
            product: this.state.product.product,
          },
        },
      });
    }


  };

  render() {
    const { insurance, insuranceOptions, product } = this.state;

    const options = insuranceOptions.map((option, i) => (
      <Option key={option.label}>
        <label>
          <input
            type="radio"
            name="insurance"
            value={option.label}
            checked={insurance === i}
            onChange={this.setInsurance(i)}
          />
          <span>{option.label} {option.price !== 0 && <>(+ {numeral(product.price * option.price / 100).format('0,0.00')} {product.currency})</>}</span>
        </label>
      </Option>
    ));

    return (
      <Article>
        <Helmet>
          <title>Checkout</title>
        </Helmet>

        <Product>
          <img src={product.image} width="200" alt={product.product} />

          <Details>
            <h2>{product.product}</h2>
            <p>{product.details}</p>

            <p>
              <b>
                Price:
                {' '}
                {numeral(product.price).format('0,0.00')}
                {' '}
                {product.currency}
              </b>
            </p>
          </Details>
        </Product>

        {!this.state.loading && !this.state.purchase && (
          <CheckoutForm>
            <h3>Checkout</h3>

            <p>Additional insurance premium:</p>

            {options}

            <h4>
              Total:
              {' '}
              {this.getTotal(product.price)}
              {' '}
              {product.currency}
            </h4>

            <StripeProvider apiKey="pk_RXwtgk4Z5VR82S94vtwmam6P8qMXQ">
              <Elements>
                <CardForm handleChange={this.handleChange} handleSubmit={this.handleSubmit} />
              </Elements>
            </StripeProvider>

          </CheckoutForm>
        )}

        {this.state.loading && !this.state.purchase && (
          <Purchase>
            <Spinner />
          </Purchase>
        )}

        {!this.state.loading && this.state.purchase && (
            <div style={{textAlign: 'center'}}>
              <h3>Congratulations!</h3>
              <p><b>Your purchase:</b></p>
              <p>Product: {product.product}</p>

              {this.state.purchase.policy && (
                <div>
                  <p><b>Policy:</b></p>
                  <p>Id: {this.state.purchase.policy.id}</p>
                  <p><a href={`https://kovan.etherscan.io/tx/${this.state.purchase.policy.transactionHash}`} target="_blank">Transaction</a></p>
                </div>
              )}
            </div>
        )}

      </Article>
    );
  }
}

export default Checkout;
