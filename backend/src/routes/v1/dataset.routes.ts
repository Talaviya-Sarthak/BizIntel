import { Router } from 'express';
import * as datasetController from '../../controllers/dataset.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireDatasetOwner } from '../../middlewares/requireDatasetOwner';
import { uploadDatasetFile } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { datasetPreviewQuerySchema, datasetUploadSchema } from '../../validators/dataset.validator';

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
