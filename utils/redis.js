import { createClient } from "redis";

class RedisClient {
	// The constructor
	constructor() {
		this.client = createClient({
			socket: {
			  host: '127.0.0.1',
			  port: 6379,
			}
		  })
			.on('error', (err) => console.log('Redis client not connected to the server: ', err))
		this.alive = false; // This variable is used with event listeners to indicate live access

		this.client.on('connect', () => {
			this.alive = true;
			console.log('Redis client connected to the server');
		});
	}

	// The init function is created to seperate the connection to the redis server
	async init() {
		await this.client.connect();
	}


	// isAlive function
	isAlive() {
		return this.alive;
	}

	// The getter method of values in redis
	async get(key) {
		return await this.client.get(key);
	}

	// The setter with an expiration method in redis
	async set(key, value, duration) {
		await this.client.setEx(key, duration, value)
	}

	// The delete method of redis
	async del(key) {
		await this.client.del(key);
	}
}

const redisClient = new RedisClient()
export default redisClient;