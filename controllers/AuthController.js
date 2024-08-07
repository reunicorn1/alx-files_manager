import { v4 as uuidv4 } from 'uuid';
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
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, req.user._id.toString(), 24 * 3600);
    return res.status(200).json({ token });
  }

  /**
   * Disconnects from the server, and removes the user's session
   * @return {Object} a response json object
   */
  static async getDisconnect(req, res) {
    // Checks were made in the middleware about the user related to the token

    await redisClient.del(`auth_${req.token}`);
    return res.status(204).send();
  }
}

export default AuthController;
