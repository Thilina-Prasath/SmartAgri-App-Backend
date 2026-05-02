const express = require('express');
const router = express.Router();
const { signup, login, update } = require('../controllers/userController');

router.post('/signup', signup);
router.post('/login', login);
router.put("/update", update)

module.exports = router;