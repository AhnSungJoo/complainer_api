import * as redis from 'redis';
import * as settingConfig from 'config';
import logger from '../util/logger';
import { callbackify } from 'util';

const redisClient = redis.createClient({
  'host': '192.168.0.57',
  'port': 6379,
  'db': 10,
});

function redisConnect(){
  console.log('connect redis');
  redisClient.on("error", function(err){
    logger.warn("redis connect error");
  })
}

export async function changeTelegramFlag(flag) {
  await redisConnect()
  console.log('change here')
  const key = settingConfig.get("redis-db-telegram-key");
  redisClient.set(key, flag, function(err, replies) {
    redisClient.quit()
  })
}

export async function getTelegramFlag() {
  await redisConnect()
  console.log('get here')
  const key = settingConfig.get("redis-db-telegram-key");
  const result = await redisClient.get(key, function(err, reply) {
    console.log(reply)
  });
  console.log(result)

}