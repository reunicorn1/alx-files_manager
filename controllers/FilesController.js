/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-vars */
import { tmpdir } from 'os';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, writeFile } from 'fs';
import { join as joinPath } from 'path';
import { Request, Response } from 'express';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from '../utils/db';

const VALID_FILE_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const ROOT_FOLDER_ID = 0;
const DEFAULT_ROOT_FOLDER = 'files_manager';
const MAX_FILES_PER_PAGE = 20;
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const { FOLDER_PATH } = process.env;

const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

const fileQueue = new Queue('thumbnail generation');

const isValidId = (id) => {
  const size = 24;
  let i = 0;
  const charRanges = [
    [48, 57], // 0 - 9
    [97, 102], // a - f
    [65, 70], // A - F
  ];
  if (typeof id !== 'string' || id.length !== size) {
    return false;
  }
  while (i < size) {
    const c = id[i];
    const code = c.charCodeAt(0);

    if (!charRanges.some((range) => code >= range[0] && code <= range[1])) {
      return false;
    }
    i += 1;
  }
  return true;
};

export default class FilesController {
  /**
  * A helper function used to create files and store data inside them locally
  * @return {string} returns the absolute path of the file saved locally
  */
  static async createFile(data) {
    const localPath = uuidv4();
    const dataDecoded = Buffer.from(data, 'base64');
    const fullPath = joinPath(FOLDER_PATH, localPath);

    mkDirAsync(FOLDER_PATH, { recursive: true });
    writeFileAsync(fullPath, dataDecoded);
    return fullPath;
  }

  /**
   * Uploads a file.
   * @param {Request} req The Express request object.
   * @param {Response} res The Express response object.
   */
  static async postUpload(req, res) {
    const { user } = req;
    const {
      name, type, parentId = ROOT_FOLDER_ID, isPublic = false, data = '',
    } = req.body;

    // Double checks for the presence of required parameters
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type || !Object.values(VALID_FILE_TYPES).includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (type !== 'folder' && !data) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    // Since parentID has a value a check for the parent has to be conducted
    if ((parentId !== ROOT_FOLDER_ID) && (parentId !== ROOT_FOLDER_ID.toString())) {
      const parentFile = await dbClient.filesCollection.findOne({
        _id: new mongoDBCore.BSON.ObjectId(parentId),
      });
      if (!parentFile) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (parentFile.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    // If folder It will be stored directly to DB else it will also be stored locally
    const userId = user._id.toString();
    const newFile = {
      userId: new mongoDBCore.BSON.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? '0'
        : new mongoDBCore.BSON.ObjectId(parentId),
    };
    if (type !== 'folder') {
      const localPath = FilesController.createFile(data);
      newFile.localPath = localPath;
    }
    const result = await dbClient.filesCollection.insertOne(newFile);
    const fileId = result.ops[0]._id.toString();

    // start thumbnail generation worker
    if (type === VALID_FILE_TYPES.image) {
      const jobName = `Image thumbnail [${userId}-${fileId}]`;
      fileQueue.add({ userId, fileId, name: jobName });
    }

    // Sending the response object with everything as a string except parentId if 0
    res.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? 0
        : parentId,
    });
  }

  /**
   * Retrieves files associated with a specific user based on id parameter.
   * @param {Request} req The Express request object.
   * @param {Response} res The Express response object.
   */
  static async getShow(req, res) {
    const {
      _id, userId, localPath, parentId, ...rest
    } = req.file;
    return res.status(200).json({
      id: _id.toString(),
      userId: userId.toString(),
      parentId: parentId === ROOT_FOLDER_ID.toString() ? 0 : parentId.toString(),
      ...rest,
    });
  }

  /**
   * Retrieves files associated with a specific user.
   * @param {Request} req The Express request object.
   * @param {Response} res The Express response object.
   */
  static async getIndex(req, res) {
    const { parentId = ROOT_FOLDER_ID.toString(), page = 0 } = req.query;
    const pipeline = [
      { $match: { parentId: parentId === '0' ? '0' : new mongoDBCore.BSON.ObjectId(parentId), userId: req.user._id } },
      { $skip: page * MAX_FILES_PER_PAGE },
      { $limit: MAX_FILES_PER_PAGE },
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

  /**
   * Sets the attribute isPublic to true.
   * @param {Request} req The Express request object.
   * @param {Response} res The Express response object.
   */
  static async putPublish(req, res) {
    const obj = await dbClient.filesCollection.findOneAndUpdate(req.file, {
      $set: { isPublic: true },
    }, { returnDocument: 'after' });
    const {
      userId, _id, localPath, parentId, ...rest
    } = obj.value;
    return res.status(200).json({
      id: _id.toString(),
      userId: userId.toString(),
      parentId: parentId === ROOT_FOLDER_ID.toString()
        ? 0
        : parentId.toString(),
      ...rest,
    });
  }

  /**
   * Sets the attribute isPublic to false.
   * @param {Request} req The Express request object.
   * @param {Response} res The Express response object.
   */
  static async putUnpublish(req, res) {
    const obj = await dbClient.filesCollection.findOneAndUpdate(req.file, {
      $set: { isPublic: false },
    }, { returnDocument: 'after' });
    const {
      userId, _id, localPath, parentId, ...rest
    } = obj.value;
    return res.status(200).json({
      id: _id.toString(),
      userId: userId.toString(),
      parentId: parentId === ROOT_FOLDER_ID.toString()
        ? 0
        : parentId.toString(),
      ...rest,
    });
  }
}
