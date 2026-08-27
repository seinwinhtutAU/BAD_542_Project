const express = require('express');
const { create, getByAppointment } = require('../controllers/prescription.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(requireAuth);
router.post('/', requireRole('DOCTOR'), create);
router.get('/:appointmentId', getByAppointment);

module.exports = router;
