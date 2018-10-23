const _ = require('lodash');
const Amqp = require('./amqp');
const Database = require('./db');
const HttpApp = require('./http');
const log = require('./log');
const GenericInsurance = require('./genericInsurance');


const { MESSAGE_BROKER } = process.env;

module.exports = (config) => {
  const db = new Database(config.knexfile);
  const http = new HttpApp(config.httpPort);

  const appName = _.last(process.env.npm_package_name.split('/'));
  const appVersion = process.env.npm_package_version;

  const amqp = new Amqp(MESSAGE_BROKER || 'amqp://localhost:5672', appName, appVersion);

  const genericInsurance = new GenericInsurance({
    amqp, http, appName, appVersion,
  });

  return {
    amqp, db, http, log, appName, appVersion, config, genericInsurance,
  };
};
