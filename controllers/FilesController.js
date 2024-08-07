import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'node:fs';
import mongoDBCore from 'mongodb/lib/core/index';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
class FilesController {
/**
 * A helper function used to create files and store data inside them locally
 * @return {string} returns the absolute path of the file saved locally
 */
  static async createFile(data) {
    const localPath = uuidv4();
    const dataDecoded = Buffer.from(data, 'base64');
    const fullPath = path.join(FOLDER_PATH, localPath);

    fs.mkdirSync(FOLDER_PATH, { recursive: true });
    fs.writeFileSync(fullPath, dataDecoded);
    return fullPath;
  }

  /**
   * Posts files uploaded to the system in the database or locally
   * @return {Object} a response json object
   */
  static async postUpload(req, res) {
    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    // Double checks for the presence of required parameters
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const validTypes = ['folder', 'file', 'image'];
    if (!type || !validTypes.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    // Since parentID has a value a check for the parent has to be conducted
    if (parentId !== '0') {
      const parentFile = await dbClient.filesCollection.findOne({
        _id: new mongoDBCore.BSON.ObjectId(parentId),
      });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    // If the datatype was folder It will be stored directly in the DB
    if (type === 'folder') {
      const result = await dbClient.filesCollection.insertOne({
        userId: req.user._id,
        name,
        type,
        parentId: parentId === '0' ? '0' : new mongoDBCore.BSON.ObjectId(parentId),
        isPublic,
      });
      return res.status(201).json({
        id: result.ops[0]._id.toString(),
        userId: req.user._id.toString(),
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? 0 : parentId.toString(),
      });
    }

    // Else, file needs to be stored locally, and then in the DB
    const localpath = await FilesController.createFile(data);
    const result = await dbClient.filesCollection.insertOne({
      userId: req.user._id,
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? '0' : new mongoDBCore.BSON.ObjectId(parentId),
      localPath: localpath,
    });
    console.log(result);
    return res.status(201).json({
      id: result.ops[0]._id.toString(),
      userId: req.user._id.toString(),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? 0 : parentId.toString(),
    });
  }

  static async getShow(req, res) {
    const {
      _id, userId, localPath, parentId, ...rest
    } = req.file;
    return res.status(200).json({
      id: _id.toString(),
      userId: userId.toString(),
      parentId: parentId === '0' ? 0 : parentId.toString(),
      ...rest,
    });
  }

  static async getIndex(req, res) {
    const pageSize = 10;
    const { parentId = '0', page = 0 } = req.query;
    const pipeline = [
      { $match: { parentId: parentId === '0' ? '0' : new mongoDBCore.BSON.ObjectId(parentId), userId: req.user._id } },
      { $sort: { _id: -1 } },
      { $skip: page * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: {
            $cond: { if: { $eq: ['$parentId', '0'] }, then: 0, else: '$parentId' },
          },
        },
      },
    ];
    await dbClient.filesCollection.aggregate(pipeline).toArray((err, result) => {
      if (err) console.log(err);
      return res.status(200).json(result);
    });
  }

  static async putPublish(req, res) {
    const obj = await dbClient.filesCollection.findOneAndUpdate(req.file, { $set: { isPublic: true } }, { returnDocument: 'after' });
    const { _id, localPath, ...rest } = obj.value;
    return res.status(200).json({ id: _id, ...rest });
  }

  static async putUnpublish(req, res) {
    const obj = await dbClient.filesCollection.findOneAndUpdate(req.file, { $set: { isPublic: false } }, { returnDocument: 'after' });
    const {
      _id, userId, localPath, parentId, ...rest
    } = obj.value;
    return res.status(200).json({
      id: _id.toString(),
      userId: userId.toString(),
      parentId: parentId === '0' ? 0 : parentId.toString(),
      ...rest,
    });
  }
}

export default FilesController;
