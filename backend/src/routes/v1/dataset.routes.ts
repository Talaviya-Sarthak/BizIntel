import { Router } from 'express';
import * as datasetController from '../../controllers/dataset.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireDatasetOwner } from '../../middlewares/requireDatasetOwner.js';
import { uploadDatasetFile } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { datasetPreviewQuerySchema, datasetUploadSchema } from '../../validators/dataset.validator.js';

const router = Router();

// Every dataset route requires authentication.
router.use(authenticate);

router.get('/', datasetController.listDatasets);
router.post('/', uploadDatasetFile, validate(datasetUploadSchema), datasetController.createDataset);
router.get('/:id', requireDatasetOwner, datasetController.getDataset);
router.get('/:id/download', requireDatasetOwner, datasetController.downloadDataset);
router.get('/:id/schema', requireDatasetOwner, datasetController.getDatasetSchema);
router.get(
  '/:id/preview',
  requireDatasetOwner,
  validate(datasetPreviewQuerySchema, { target: 'query' }),
  datasetController.getDatasetPreview,
);
router.delete('/:id', requireDatasetOwner, datasetController.deleteDataset);

export default router;
