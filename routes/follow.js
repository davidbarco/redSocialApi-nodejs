const express = require('express');
const router = express.Router();
const ensureAuth = require('../middlewares/auth');

const FollowController = require('../controllers/follow');


// Ruta para guardar un nuevo seguimiento
router.post('/save', ensureAuth, FollowController.save);
// Ruta para dejar de seguir a un usuario
router.delete('/unfollow', ensureAuth, FollowController.unfollow);
router.get('/following/:id', ensureAuth, FollowController.following);
router.get('/followers/:id', ensureAuth, FollowController.followers);

module.exports = router;