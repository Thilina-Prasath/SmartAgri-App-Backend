const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzePlantImage, getHistory, deleteAnalysis, } = require('../controllers/analyzeController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), analyzePlantImage);
router.get('/history', getHistory);
router.delete('/history/:id', deleteAnalysis);

module.exports = router;