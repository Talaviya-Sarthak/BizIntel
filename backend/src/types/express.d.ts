import type { Request } from 'express';
import type { Dataset } from '../models/dataset.model';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. */
      auth?: {
        userId: string;
      };
      /** Set by `requireDatasetOwner`. Never trust a raw dataset id. */
      dataset?: Dataset;
    }
  }
}

export {};
