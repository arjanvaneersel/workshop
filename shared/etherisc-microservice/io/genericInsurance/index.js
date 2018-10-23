const WebSocket = require('ws');
const uuid = require('uuid/v1');

/**
 * Generic insurance
 */
class GenericInsurance {
  /**
   * Constructor
   * @param {{}} amqp
   * @param {{}} http
   * @param {{}} appName
   * @param {{}} appVersion
   */
  constructor({
    amqp, http, appName, appVersion,
  }) {
    this._amqp = amqp;
    this._http = http;
    this._appName = appName;
    this._appVersion = appVersion;

    this._connections = {};
  }

  /**
   * Start
   * @return {Promise<void>}
   */
  async bootstrap() {
    this._wss = new WebSocket.Server({ server: this._http.server });

    this._wss.on('connection', ws => this._register(ws));
  }

  /**
   * Register new WebSocket connection
   * @param {{}} connection
   * @private
   */
  _register(connection) {
    const connectionId = uuid();

    this._connections[connectionId] = connection;

    this.sendWs(connectionId, {
      microservice: `${this._appName}.v${this._appVersion}`,
      topic: null,
      msg: 'WebSocket connection successfully established',
    });

    connection.on('message', message => this._processWsMessage(connectionId, message));
  }

  /**
   * Handle WebSocker message
   * @param {string} connectionId
   * @param {string} message
   * @private
   */
  _processWsMessage(connectionId, message) {
    console.log(connectionId, message);

    if (this._wsMsgHandler) {
      this._wsMsgHandler(connectionId, message);
    }
  }

  /**
   * Bind external handler for processing WebSocket messages
   * @param {function} handler
   */
  setWsMsgHandler(handler) {
    this._wsMsgHandler = handler;
  }

  /**
   * Send message to WebSocker connection
   * @param {string} connectionId
   * @param {{}} msg
   */
  sendWs(connectionId, msg) {
    if (!connectionId) return;
    this._connections[connectionId].send(JSON.stringify(msg));
  }

  /**
   * Send policy creation message to broker
   * @param {string} clientId
   * @param {{}} payload
   * @return {Promise<void>}
   */
  async createPolicy(clientId, payload) {
    const key = 'policy.create.v1';

    // Todo: implement
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this._amqp.publish('POLICY', key, Buffer.from(JSON.stringify(payload)), {
      correlationId: clientId,
      headers: {
        originatorName: process.env.npm_package_name,
        originatorVersion: process.env.npm_package_version,
      },
    });
  }

  /**
   * Send card charding message to broker
   * @param {string} correlationId
   * @param {string} policyId
   * @return {Promise<void>}
   */
  async chargeCard(correlationId, policyId) {
    const key = 'policy.charge_card.v1';

    // Todo: implement
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this._amqp.publish(
      'POLICY',
      key,
      Buffer.from(JSON.stringify({ policyId })),
      {
        correlationId,
        headers: {
          originatorName: process.env.npm_package_name,
          originatorVersion: process.env.npm_package_version,
        },
      },
    );
  }

  /**
   * Send fiat payout message to broker
   * @param {string} correlationId
   * @param {string} policyId
   * @return {Promise<void>}
   */
  async payout(correlationId, policyId) {
    const key = 'policy.payout.v1';

    // Todo: implement
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this._amqp.publish(
      'POLICY',
      key,
      Buffer.from(JSON.stringify({ policyId })),
      {
        correlationId,
        headers: {
          originatorName: process.env.npm_package_name,
          originatorVersion: process.env.npm_package_version,
        },
      },
    );
  }

  /**
   * Send certificate issuing message to broker
   * @param {string} correlationId
   * @param {string} policyId
   * @return {Promise<void>}
   */
  async issueCertificate(correlationId, policyId) {
    const key = 'policy.issue_certificate.v1';

    // Todo: implement
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this._amqp.publish(
      'POLICY',
      key,
      Buffer.from(JSON.stringify({ policyId })),
      {
        correlationId,
        headers: {
          originatorName: process.env.npm_package_name,
          originatorVersion: process.env.npm_package_version,
        },
      },
    );
  }
}

module.exports = GenericInsurance;
