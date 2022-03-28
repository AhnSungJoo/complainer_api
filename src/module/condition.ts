import logger from '../util/logger';



export async function ipAllowedCheck(ctx) {
  logger.info(`ip check`);
  //const trustedIps: Array<String> = config.get('ip-allowed');
  //test 용
  const trustedIps = "1.2.3.4.";
  logger.info(`ip: ${trustedIps}`);
  var requestIP = ctx.ip;
  logger.info(`ip-req: ${requestIP}`);
  if(trustedIps.indexOf(requestIP) >= 0) {
    return true;
  } else {
    return false;
  }
}
