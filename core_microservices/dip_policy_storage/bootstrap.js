const { bootstrap, isDockerHost } = require('@etherisc/microservice');
const DipPolicyStorage = require('./DipPolicyStorage');


bootstrap(DipPolicyStorage, {
  db: true,
  amqp: true,
});
