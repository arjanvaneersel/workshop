const getPort = require('get-port-sync');
const knexfile = require('./knexfile');
const ioModule = require('./io/module');
const DipMicroservice = require('./services/DipMicroservice');
const { isDockerHost, isKubernetesHost } = require('./utils');


const KUBERNETES_HTTP_PORT = 3000;

/**
 * Start application
 * @param {class} App
 * @param {{}} config
 */
function bootstrap(App, config = {}) {
  const ioConfig = {
    knexfile,
    ...config,
  };

  try {
    if (isKubernetesHost()) {
      ioConfig.httpPort = KUBERNETES_HTTP_PORT;
    } else {
      ioConfig.httpPort = ioConfig.httpDevPort || getPort();
    }

    const ioDeps = ioModule(ioConfig);
    const microservice = new DipMicroservice(App, ioDeps);

    microservice.bootstrap().catch((err) => {
      ioDeps.log.error(err);

      if (err.exit) process.exit(1);
    });
  } catch (err) {
    console.error(err);

    if (err.exit) process.exit(1);
  }
}

/**
 * Create microservice instance
 * @param {Class} App
 * @param {{}} config
 * @return {DipMicroservice}
 */
function fabric(App, config = {}) {
  const ioConfig = {
    db: knexfile,
    ...config,
  };

  const ioDeps = ioModule(ioConfig);
  return new DipMicroservice(App, ioDeps);
}

module.exports = {
  bootstrap,
  fabric,
  isDockerHost,
  isKubernetesHost,
  knexfile,
};
