const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

router.get('/:id', auth, profileController.getProfile);
router.put('/:id', auth, profileController.updateProfile);
router.delete('/:id', auth, profileController.deactivateAccount);

module.exports = router;