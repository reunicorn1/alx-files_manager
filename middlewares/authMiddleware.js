import sha1 from 'sha1';
import mongoDBCore from 'mongodb/lib/core/index';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
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
  const user = await dbClient.usersCollection.findOne({
    _id: new mongoDBCore.BSON.ObjectId(userid),
  });
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

export const getFile = async (req, res, next) => {
  const { id = NULL_ID } = req.params;
  const file = await dbClient.filesCollection.findOne({
    userId: req.user._id ? req.user._id : NULL_ID,
    _id: new mongoDBCore.BSON.ObjectId(id),
  });
  if (!file) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  req.file = file;
  next();
};
