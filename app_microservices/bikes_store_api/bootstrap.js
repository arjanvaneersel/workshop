const { bootstrap } = require('@etherisc/microservice');
const BikesStoreInsurance = require('./BikesStoreInsurance');


bootstrap(BikesStoreInsurance, {
  amqp: true,
  genericInsurance: true,
  httpDevPort: 3011,
});
