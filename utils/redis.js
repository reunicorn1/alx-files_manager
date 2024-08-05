import redis from 'redis';
import util from 'util';

class RedisClient {
  // The constructor
  constructor() {
    this.client = redis.createClient({
      socket: {
        host: '127.0.0.1',
        port: 6379,
      },
    }).on('error', (err) => {
      console.log('Redis client not connected to the server:', err);
      this.alive = false;
    });
    this.alive = true; // This variable is used with event listeners to indicate live access
    this.client.on('connect', () => {
      this.alive = true;
    });
  }

  // isAlive function
  isAlive() {
    return this.alive;
  }

  // The getter method of values in redis
  async get(key) {
    const get = util.promisify(this.client.get.bind(this.client));
    const ans = await get(key);
    return ans;
  }

  // The setter with an expiration method in redis
  async set(key, value, duration) {
    const setex = util.promisify(this.client.setex.bind(this.client));
    await setex(String(key), duration, String(value));
  }

  // The delete method of redis
  async del(key) {
    const del = util.promisify(this.client.DEL.bind(this.client));
    await del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
