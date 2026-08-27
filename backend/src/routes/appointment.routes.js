const express = require('express');
const {
  create, listMine, listAll, updateStatus, cancel,
} = require('../controllers/appointment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(requireAuth);
router.post('/', requireRole('STUDENT'), create);
router.get('/mine', requireRole('STUDENT'), listMine);
router.get('/', requireRole('DOCTOR', 'ADMIN'), listAll);
router.patch('/:id/status', requireRole('DOCTOR', 'ADMIN'), updateStatus);
router.patch('/:id/cancel', requireRole('STUDENT', 'ADMIN'), cancel);

module.exports = router;
