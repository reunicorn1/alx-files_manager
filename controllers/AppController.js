import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

/**
 * Class for controlling basic operations of the app
 */
class AppController {
  /**
   * Checks if connection to MongoDB and Redis is Alive
   * @return {undefined}
   */
  static getStatus(req, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  /**
   * Checks number of documents in the collection users and files
   * @return {undefined}
   */
  static getStats(req, res) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()]).then(([usercount, filecount]) => {
      res.status(200).json({ users: usercount, files: filecount });
    });
  }
}

export default AppController;
