import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * Class for controlling basic operations of the app
 */
const AppController = {
  /**
   * Checks if connection to MongoDB and Redis is Alive
   * @return {undefined}
   */
  getStatus(req, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  },

  /**
   * Checks number of documents in the collection users and files
   * @return {undefined}
   */
  async getStats(req, res) {
    res.status(200).json({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
  },

};

export default AppController;
