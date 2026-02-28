import { Router, Request, Response } from 'express';
import { getConfig, saveConfig } from '../store';

export const configRouter = Router();

configRouter.get('/', (_req: Request, res: Response) => {
  res.json(getConfig());
});

configRouter.put('/', (req: Request, res: Response) => {
  const updated = saveConfig(req.body);
  res.json(updated);
});
