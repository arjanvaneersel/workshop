const uuid = require('uuid/v1');
const Ajv = require('ajv');
const sha256 = require('js-sha256');
const _ = require('lodash');
const models = require('./models/module');


const ajv = new Ajv();

const applyPolicyMsgSchema = {
  properties: {
    customer: {
      type: 'object',
      properties: {
        firstname: { type: 'string' },
        lastname: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['firstname', 'lastname', 'email'],
    },
    policy: {
      type: 'object',
      properties: {
        distributorId: { type: 'string' },
      },
      required: ['distributorId'],
    },
  },
  required: ['customer', 'policy'],
  additionalProperties: false,
};

/**
 * Dip Policy Storage
 */
class DipPolicyStorage {
  /**
   * Constructor
   * @param {Amqp} amqp
   */
  constructor({ amqp, db }) {
    this.amqp = amqp;

    this.models = models(db);
  }

  /**
   * Start application
   * @return {Promise<void>}
   */
  async bootstrap() {
    this.amqp.consume('POLICY', 'policy.create.v1', this.onPolicyCreateMessage.bind(this));
  }

  /**
   * Generate id for customer
   * @param {string} firstname
   * @param {string} lastname
   * @param {string} email
   * @return {*}
   */
  generateCustomerId(firstname, lastname, email) {
    const salt = process.env.SALT || 'salt';
    return sha256(`${firstname}${lastname}${email}${salt}`).slice(0, 31);
  }

  /**
   * Create new customer if doesn't exists
   * @param {{}} customer
   * @return {string}
   */
  async createCustomerIfNotExists(customer) {
    const customerId = this.generateCustomerId(customer.firstname, customer.lastname, customer.email);

    const { Customer } = this.models;

    // Check if customer exists
    const customerExists = await Customer.query().where('id', customerId).first();

    // Create customer if it doesn't exists
    if (!customerExists) {
      await Customer.query().insertGraph({
        id: customerId,
        ..._.pick(customer, ['firstname', 'lastname', 'email']),
        extra: [
          ..._.map(
            _.toPairs(_.omit(customer, ['firstname', 'lastname', 'email'])),
            ([field, value]) => ({ field, value }),
          ),
        ],
      });
    }

    return customerId;
  }

  /**
   * Create new policy
   * @param {string} customerId
   * @param {{}} policy
   * @return {string}
   */
  async createPolicy(customerId, policy) {
    // Generate policy id
    const policyId = uuid();

    const { Policy } = this.models;

    // Create new policy
    await Policy.query().insertGraph({
      id: policyId,
      customerId,
      ..._.pick(policy, ['distributorId']),

      extra: [
        ..._.map(
          _.toPairs(_.omit(policy, ['distributorId'])),
          ([field, value]) => ({ field, value }),
        ),
      ],
    });

    return policyId;
  }

  /**
   * Get disctibutor
   * @param {string} distributorId
   * @return {*}
   */
  getDistributor(distributorId) {
    // Get models
    const { Distributor } = this.models;

    return Distributor.query().where('id', distributorId).first();
  }

  /**
   * Handle policy creation
   * @param {DipMessage} message
   * @return {*}
   */
  async onPolicyCreateMessage(message) {
    // Parse message content
    const data = JSON.parse(message.content);

    // Validate message
    const validate = ajv.compile(applyPolicyMsgSchema);

    if (!validate(data)) {
      await this.amqp.publish('POLICY', 'policy.creation_error.v1', { error: validate.errors }, data.correlationId);
      return;
    }

    // Check if distributor exists
    const distributor = await this.getDistributor(data.policy.distributorId);

    if (!distributor) {
      await this.amqp.publish('POLICY', 'policy.creation_error.v1', { error: 'Distributor does not exists' }, data.correlationId);
      return;
    }

    // Create customer if doesn't exists
    const customerId = await this.createCustomerIfNotExists(data.customer);

    // Create new policy
    const policyId = await this.createPolicy(customerId, data.policy);

    // Publish message about successful policy creation
    await this.amqp.publish('POLICY', 'policy.creation_success.v1', { policyId }, message.correlationId);
  }
}

module.exports = DipPolicyStorage;
