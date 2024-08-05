import { createClient } from 'redis'
import { promisify } from 'util'


class RedisClient {
  // The constructor
  constructor() {
    this.client = createClient({
      socket: {
        host: '127.0.0.1',
        port: 6379,
      },
    }).on('error', (err) =>
      console.log('Redis client not connected to the server: ', err)
    )
    this.alive = true // This variable is used with event listeners to indicate live access

    this.client.on('connect', () => {
      this.alive = true
    })
  }

  // isAlive function
  isAlive() {
    return this.alive
  }

  // The getter method of values in redis
  async get(key) {
	const promise_get = promisify(this.client.get.bind(this.client))
	return await promise_get(key)
  }

  // The setter with an expiration method in redis
  async set(key, value, duration) {
    if (typeof duration !== 'number') {
      throw new Error('Duration must be a number')
    }
	const promise_setex = promisify(this.client.setex.bind(this.client))
    await promise_setex(String(key), duration, String(value))
  }


  // The delete method of redis
  async del(key) {
	const promise_del = promisify(this.client.del.bind(this.client));
    await promise_del(key);
  }
}

const redisClient = new RedisClient()
export default redisClient
