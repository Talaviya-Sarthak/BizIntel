import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import * as datasetController from '../controllers/dataset.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { validate } from '../../../middlewares/validate';
import { createDatasetSchema, listDatasetsSchema } from '../validators/dataset.validator';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'datasets');

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1,
  },
});

const router = Router();

router.use(authenticate);

router.get('/', validate(listDatasetsSchema), datasetController.list);
router.get('/:id', datasetController.getOne);
router.post('/', upload.single('file'), datasetController.create);
router.delete('/:id', datasetController.remove);
router.get('/:id/data', datasetController.getData);

export default router;
