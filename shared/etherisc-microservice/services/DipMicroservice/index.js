const Router = require('koa-router');
const _ = require('lodash');
const { throwError } = require('../../utils');

/**
 * Base DIP microservice wrapper
 */
class DipMicroservice {
  /**
   * Constructor
   * @param {class} App
   * @param {ioModule} ioDeps
   */
  constructor(App, ioDeps) {
    this.App = App;

    this.appName = ioDeps.appName;
    this.appVersion = ioDeps.appVersion;
    this.amqp = ioDeps.amqp;
    this.db = ioDeps.db;
    this.http = ioDeps.http;
    this.log = ioDeps.log;
    this.config = ioDeps.config;
    this.genericInsurance = ioDeps.genericInsurance;
  }

  /**
   * Start application
   * @return {Promise<void>}
   */
  async bootstrap() {
    try {
      const appIoDeps = {};

      if (this.config.amqp) {
        await this.amqp.bootstrap();
        appIoDeps.amqp = this.amqp;
      }

      if (this.config.db) {
        await this.db.bootstrap();
        appIoDeps.db = this.db.getConnection();
      }

      if (this.config.genericInsurance) {
        appIoDeps.genericInsurance = this.genericInsurance;
      }

      const applicationRouter = new Router();

      this.app = new this.App({
        ...appIoDeps,
        log: this.log,
        config: this.config,
        router: applicationRouter,
        appName: this.appName,
        appVersion: this.appVersion,
      });

      await this.http.bootstrap(applicationRouter);

      if (this.config.genericInsurance) {
        await this.genericInsurance.bootstrap();
      }

      await this.app.bootstrap();

      this.http.setReadyStatus(true);

      this.log.info(`${this.appName}.v${this.appVersion} listening on http://localhost:${this.http.port}`);

      ['SIGTERM', 'SIGHUP', 'SIGINT'].forEach((signal) => {
        process.on(signal, () => {
          this.log.debug(`${signal} received, shutdown ${this.appName}.v${this.appVersion} microservice`);

          this.shutdown();
        });
      });
    } catch (e) {
      throwError(e);
    }
  }

  /**
   * Shutdown application
   */
  shutdown() {
    const status = this.http.getShuttingDownStatus();

    if (status === true) {
      this.log.debug('Server is already shutting down');
      return;
    }

    this.http.setReadyStatus(false);
    this.http.setShuttingDownStatus(true);

    if (this.config.amqp) {
      this.amqp.shutdown();
    }

    if (this.config.db) {
      this.db.shutdown();
    }

    process.exit();
  }
}

module.exports = DipMicroservice;
