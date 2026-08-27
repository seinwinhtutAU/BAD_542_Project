const express = require('express');
const {
  listDoctors, createDoctor, updateDoctor, deleteDoctor,
} = require('../controllers/doctor.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.get('/', requireAuth, listDoctors);
router.post('/', requireAuth, requireRole('ADMIN'), createDoctor);
router.patch('/:id', requireAuth, requireRole('ADMIN'), updateDoctor);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteDoctor);

module.exports = router;
