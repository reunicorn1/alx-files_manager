import dbClient from '../utils/db';

class FilesController {
  // eslint-disable-next-line consistent-return
  static async postUpload(req, res) {
    const token = req.headers['X-Token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const {
      name, type, parentId = 0, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    const validTypes = ['folder', 'file', 'image'];

    if (!type || !validTypes.includes(type)) return res.status(400).json({ error: 'Missing type' });

    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    // Reconstrruct how parentFile is retrieved as getFileById method doesn't exist
    if (parentId !== 0) {
      const parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (!parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }
}

export default FilesController;
