import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * Class for handling authentication and autherization
 */
class AuthController {
  /**
   * Connects to the server for the first time and established a session
   * @return {Object} a response json object
   */
  static async getConnect(req, res) {
    const base64 = req.headers.authorization;
    if (!base64) return res.status(401).json({ error: 'Unauthorized' });

    const encypted = Buffer.from(base64.split(' ')[1], 'base64').toString('utf-8');
    // Get data stored in the decoded string
    const [email, password] = encypted.split(':');
    const hashedpwd = crypto.createHash('sha1').update(password).digest('hex');

    // Look for the user if exists
    const existing = await dbClient.usersCollection.findOne({ email, password: hashedpwd });
    if (!existing) return res.status(401).json({ error: 'Unauthorized' });
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, existing._id, 24 * 3600);
    return res.status(200).json({ token });
  }

  /**
   * Disconnects from the server, and removes the user's session
   * @return {Object} a response json object
   */
  static async getDisconnect(req, res) {
    // Find the user associated with the toke
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    // Get the user signed in the session using the token from redis
    const user = await redisClient.get(`auth_${token}`);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

export default AuthController;
