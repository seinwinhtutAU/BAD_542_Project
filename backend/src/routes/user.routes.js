const express = require('express');
const { listUsers, updateUserRole, deleteUser } = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/', listUsers);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
