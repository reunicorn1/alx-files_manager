import pkg from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'node:fs';
import dbClient from '../utils/db';

const { ObjectId } = pkg;
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
    console.log('File written successfully at:', fullPath);
    return fullPath;
  }

  /**
   * Posts files uploaded to the system in the database or locally
   * @return {Object} a response json object
   */
  static async postUpload(req, res) {
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    // Double checks for the presence of required parameters
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const validTypes = ['folder', 'file', 'image'];
    if (!type || !validTypes.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    // Since parentID has a value a check for the parent has to be conducted
    if (parentId !== 0) {
      const parentFile = await dbClient.filesCollection.findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    // If the datatype was folder It will be stored directly in the DB
    if (type === 'folder') {
      const result = await dbClient.filesCollection.insertOne({
        userId: req.user._id.toString(), name, type, parentId, isPublic,
      });
      const { ops: [{ _id, ...rest }] } = result;
      return res.status(201).json({ id: _id, ...rest });
    }

    // Else, file needs to be stored locally, and then in the DB
    const localpath = await FilesController.createFile(data);
    const result = await dbClient.filesCollection.insertOne({
      userId: req.user._id.toString(), name, type, isPublic, parentId, localPath: localpath,
    });
    const { ops: [{ _id, localPath, ...rest }] } = result;
    return res.status(201).json({ id: _id, ...rest });
  }
}

export default FilesController;
