import sha1 from 'sha1';
import pkg from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = pkg;
/**
 * A middleware used to find associated user with the x-token
 * @return {undefined} perfomes sideeffects by adding the user found to the req object
 */
export const getUserX = async (req, res, next) => {
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  // Get the userid of user signed in the session using the token from redis
  const userid = await redisClient.get(`auth_${token}`);
  if (!userid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  // Get the user linked to this userid
  const user = await dbClient.usersCollection.findOne({ _id: new ObjectId(userid) });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.token = token;
  req.user = user;
  next();
};
/**
 * A middleware used to find associated user with the base authorization key
 * @return {undefined} perfomes sideeffects by adding the user found to the req object
 */
export const getUserBase = async (req, res, next) => {
  const base64 = req.headers.authorization;
  if (!base64 || base64.split(' ').length !== 2 || base64.split(' ')[0] !== 'Basic') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const encypted = Buffer.from(base64.split(' ')[1], 'base64').toString('utf-8');

  // Get data stored in the decoded string
  const [email, password] = encypted.split(':');

  // Look for the user if exists
  const user = await dbClient.usersCollection.findOne({ email, password: sha1(password) });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
};
