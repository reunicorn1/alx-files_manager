import sha1 from 'sha1';
import dbClient from '../utils/db';

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
    const hash = sha1(password);
    const result = await dbClient.usersCollection.insertOne({ email, password: hash });
    return res.status(201).json({ id: result.ops[0]._id, email: result.ops[0].email });
  }

  /**
   * Retrieves the user's data from the database, if he exists
   * @return {Object} a response json object
   */
  static async getMe(req, res) {
    // All checks necessary were made already in the middleware
    return res.status(200).json({ id: req.user._id.toString(), email: req.user.email });
  }
}

export default UsersController;
