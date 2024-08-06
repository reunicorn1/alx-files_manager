import crypto from 'crypto';
import pkg from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = pkg;

/**
 * Class for controlling basic operations related to the user
 */
class UsersController {
  /**
   * Creates a new user instance and save it to the database
   * @return {Object} a response json object
   */
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    if (!password) return res.status(400).json({ error: 'Missing password' });

    const existing = await dbClient.usersCollection.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Already exist' });

    // Hashing the password, creating a new user and returning the result
    const hash = crypto.createHash('sha1').update(password).digest('hex');
    const result = await dbClient.usersCollection.insertOne({ email, password: hash });
    return res.status(201).json({ id: result.ops[0]._id, email: result.ops[0].email });
  }

  /**
   * Retrieves the user's data from the database, if he exists
   * @return {Object} a response json object
   */
  static async getMe(req, res) {
    // Look for the user
    const token = req.headers['x-token'];
    const userid = await redisClient.get(`auth_${token}`);

    if (!userid) return res.status(401).json({ error: 'Unauthorized' });
    const user = await dbClient.usersCollection.findOne({ _id: new ObjectId(userid) });
    return res.status(401).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
