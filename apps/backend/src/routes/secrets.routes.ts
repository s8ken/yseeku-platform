import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requireScopes } from '../middleware/rbac.middleware';
import { putSecret, getSecret } from '../services/secrets.service';
import { secretsOperationsTotal } from '../observability/metrics';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

router.post('/', protect, requireScopes(['secrets:manage']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, value } = req.body;
    if (!name || !value) {
      res.status(400).json({ success: false, message: 'name and value required' });
      return;
    }
    const result = await putSecret(name, value);
    if (!result) {
      secretsOperationsTotal.inc({ operation: 'put', provider: 'env', status: 'skipped' });
      res.status(200).json({ success: true, message: 'Using env provider; store value in environment', data: { hint: `${name}_ENCRYPTED for KMS` } });
      return;
    }
    secretsOperationsTotal.inc({ operation: 'put', provider: result.provider, status: 'ok' });
    res.status(201).json({ success: true, data: result });
  } catch (e: unknown) {
    secretsOperationsTotal.inc({ operation: 'put', provider: 'unknown', status: 'error' });
    res.status(500).json({ success: false, message: 'Failed to store secret', error: getErrorMessage(e) });
  }
});

router.get('/:name', protect, requireScopes(['secrets:manage']), async (req: Request, res: Response): Promise<void> => {
  try {
    const name = String(req.params.name);
    const value = await getSecret(name);
    if (value == null) {
      secretsOperationsTotal.inc({ operation: 'get', provider: 'unknown', status: 'miss' });
      res.status(404).json({ success: false, message: 'Secret not found' });
      return;
    }
    secretsOperationsTotal.inc({ operation: 'get', provider: 'unknown', status: 'ok' });
    res.json({ success: true, data: { name, valuePresent: true } });
  } catch (e: unknown) {
    secretsOperationsTotal.inc({ operation: 'get', provider: 'unknown', status: 'error' });
    res.status(500).json({ success: false, message: 'Failed to read secret', error: getErrorMessage(e) });
  }
});

export default router;
