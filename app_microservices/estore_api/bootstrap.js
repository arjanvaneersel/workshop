const { bootstrap } = require('@etherisc/microservice');
const EStoreInsurance = require('./EStoreInsurance');


bootstrap(EStoreInsurance, {
  //db: true,
  amqp: true,
  genericInsurance: true,
  httpDevPort: 3010,
});
