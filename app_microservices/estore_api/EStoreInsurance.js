const moment = require('moment');
const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const ABI = require('./EStoreInsurance.json');


const MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treatment';
const CONTRACT = '0xe52ccDa47f12FC8119261e38124B6d3b558aD611';
const ACCOUNT = '0x1b7eeb70b214a41e19fc8ba66fb291b9b097ecaf';
const HTTP_PROVIDER = 'https://kovan.infura.io/1reQ7FJQ1zs0QGExhlZ8';

const CURRENCIES = {
  EUR: 0,
  USD: 1,
  GPB: 2,
};

const EXPIRATIONS = {
  '1 year': () => moment().add(1, 'year').unix(),
  '2 year': () => moment().add(2, 'year').unix(),
  '3 year': () => moment().add(3, 'year').unix(),
};

const web3 = new Web3();
const provider = new HDWalletProvider(MNEMONIC, HTTP_PROVIDER);
web3.setProvider(provider);


/**
 * EStore insurance API
 */
class EStoreInsurance {
  /**
   * Constructor
   * @param {GenericInsurance} genericInsurance
   * @param {Logger} log
   */
  constructor({ genericInsurance, log }) {
    this.gi = genericInsurance;
    this.log = log;
  }

  /**
   * On application started livecycle hook
   * @return {Promise<void>}
   */
  async bootstrap() {
    this.gi.setWsMsgHandler(this.onWsMessage.bind(this));

    this.contract = new web3.eth.Contract(ABI, CONTRACT, {
      gasPrice: 5500000,
      from: ACCOUNT,
    });
  }

  /**
   * Handle message form websocket
   * @param {string} client
   * @param {string} payload
   */
  onWsMessage(client, payload) {
    const message = JSON.parse(payload);
    const { id, type, data } = message;
    const handler = this[type].bind(this);

    if (!id) {
      this.log.error('Id should be provided', type, message);
    }

    if (!type) {
      this.log.error('Invalid message type', type, message);
      return;
    }

    handler(client, { id, data });
  }

  /**
   * Handle event from contract
   * @param {Event} event
   */
  onContractEvent(event) {
    const { name } = event;

    const handler = this[`on${name}`].bind(this);

    if (!handler) {
      this.log.error('Handler for this event does not exists', event);
      return;
    }

    handler(event);
  }

  /**
   * Handle LogPolicySetState event
   * @param {Event} event
   */
  onLogPolicySetState(event) {
    this.log.info('onLogPolicySetState', event);
  }


  /**
   * Handle LogClaimSetState event
   * @param {Event} event
   */
  onLogClaimSetState(event) {
    this.log.info('onLogClaimSetState', event);
  }

  /**
   * Send newPolicy transaction
   * @param {string} client
   * @param {{}} message
   */
  newPolicy(client, message) {
    this.log.info('newPolicy', message);

    this.contract.methods.newPolicy(
      web3.utils.asciiToHex(message.data.policy.vendorCode),
      web3.utils.asciiToHex(message.data.policy.product),
      message.data.policy.premium,
      message.data.policy.sumInsured,
      CURRENCIES[message.data.policy.currency],
      EXPIRATIONS[message.data.policy.expiration](),
      web3.utils.asciiToHex(message.id),
    )
      .send()
      .then((data) => {
        this.gi.sendWs(client, { id: message.id, data });
      });
  }

  /**
   * Send underwrite transaction
   * @param {string} client
   * @param {{}} message
   */
  async underwrite(client, message) {
    this.log.info('underwrite', message);

    await this.contract.methods.underwrite(
      message.data.id,
    ).send();

    const policy = await this.contract.methods.policies(message.data.id).call();
    const risk = await this.contract.methods.risks(policy.riskId).call();

    this.gi.sendWs(client, {
      id: message.id,
      data: {
        policy: { policyId: message.data.id, ...policy, ...risk },
      },
    });
  }

  /**
   * Send decline transaction
   * @param {string} client
   * @param {{}} message
   */
  async decline(client, message) {
    this.log.info('decline', message);

    await this.contract.methods.decline(
      message.data.id,
      web3.utils.asciiToHex(message.data.details),
    ).send();

    const policy = await this.contract.methods.policies(message.data.id).call();
    const risk = await this.contract.methods.risks(policy.riskId).call();

    this.gi.sendWs(client, {
      id: message.id,
      data: {
        policy: { policyId: message.data.id, ...policy, ...risk },
      },
    });
  }

  /**
   * Send newClaim transaction
   * @param {string} client
   * @param {{}} message
   */
  newClaim(client, message) {
    this.log.info('newClaim', message);

    try {
      this.contract.methods.newClaim(
        message.data.policyId,
        web3.utils.asciiToHex(message.data.reason),
      )
        .send()
        .then((data) => {
          this.gi.sendWs(client, { id: message.id, data });
        })
        .catch((e) => {
          console.error(e);

          this.gi.sendWs(client, { id: message.id, data: { error: 'Transaction failed' } });
        });
    } catch (e) {
      console.error(e);

      this.gi.sendWs(client, { id: message.id, data: { error: 'Invalid arguments for transaction' } });
    }
  }

  /**
   * Send expire transaction
   * @param {string} client
   * @param {{}} message
   */
  async expire(client, message) {
    this.log.info('expire', message);

    try {
      await this.contract.methods.expire(
        message.data.id,
      ).send();

      const policy = await this.contract.methods.policies(message.data.id).call();
      const risk = await this.contract.methods.risks(policy.riskId).call();

      this.gi.sendWs(client, {
        id: message.id,
        data: {
          policy: { policyId: message.data.id, ...policy, ...risk },
        },
      });
    } catch (e) {
      console.error(e);

      this.gi.sendWs(client, { id: message.id, data: { error: e.message } });
    }
  }

  /**
   * Send rejectClaim transaction
   * @param {string} client
   * @param {{}} message
   */
  async rejectClaim(client, message) {
    this.log.info('rejectClaim', message);

    try {
      console.log('1');
      await this.contract.methods.rejectClaim(
        message.data.id,
        web3.utils.asciiToHex(message.data.details),
      )
        .send()
        .catch(console.error);

      const claim = await this.contract.methods.claims(message.data.id).call();
      const policy = await this.contract.methods.policies(claim.policyId).call();
      const risk = await this.contract.methods.risks(policy.riskId).call();

      this.gi.sendWs(client, {
        id: message.id,
        data: {
          policy: { policyId: claim.policyId, ...policy, ...risk },
          claim: { claimId: message.data.id, ...claim },
        },
      });
    } catch (e) {
      console.error(e);

      this.gi.sendWs(client, { id: message.id, data: { error: e.message } });
    }
  }

  /**
   * Send confirmClaim transaction
   * @param {string} client
   * @param {{}} message
   */
  async confirmClaim(client, message) {
    this.log.info('confirmClaim', message);

    await this.contract.methods.confirmClaim(
      message.data.id,
      web3.utils.asciiToHex(message.data.details),
    ).send();

    const claim = await this.contract.methods.claims(message.data.id).call();
    const policy = await this.contract.methods.policies(claim.policyId).call();
    const risk = await this.contract.methods.risks(policy.riskId).call();

    this.gi.sendWs(client, {
      id: message.id,
      data: {
        policy: { policyId: claim.policyId, ...policy, ...risk },
        claim: { claimId: message.data.id, ...claim },
      },
    });
  }

  /**
   * Send confirmPayout transaction
   * @param {string} client
   * @param {{}} message
   */
  async confirmPayout(client, message) {
    this.log.info('confirmPayout', message);

    await this.contract.methods.confirmPayout(
      message.data.id,
      web3.utils.asciiToHex(message.data.details),
    ).send();

    const policy = await this.contract.methods.policies(message.data.id).call();
    const risk = await this.contract.methods.risks(policy.riskId).call();

    this.gi.sendWs(client, {
      id: message.id,
      data: {
        policy: { policyId: message.data.id, ...policy, ...risk },
      },
    });
  }

  /**
   * Request list of policies
   * @param {string} client
   * @param {{}} message
   */
  async getPolicies(client, message) {
    this.log.info('get policies count', message);

    const total = await this.contract.methods.getPoliciesCount().call();

    const policies = [];

    for (let i = 0; i < total; i += 1) {
      const policy = await this.contract.methods.policies(i).call();
      const risk = await this.contract.methods.risks(policy.riskId).call();
      policies.push({ policyId: i, ...policy, ...risk });
    }

    this.gi.sendWs(client, { id: message.id, policies });
  }

  /**
   * Request list of claims
   * @param {string} client
   * @param {{}} message
   * @return {Promise<void>}
   */
  async getClaims(client, message) {
    this.log.info('get claims count', message);

    const total = await this.contract.methods.getClaimsCount().call();

    const claims = [];

    for (let i = 0; i < total; i += 1) {
      const claim = await this.contract.methods.claims(i).call();
      claims.push({ claimId: i, ...claim });
    }

    this.gi.sendWs(client, { id: message.id, claims });
  }
}

module.exports = EStoreInsurance;
