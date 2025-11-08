// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { handleAiQuery } = require('../controller/aiSearchController');

// Frontend posts user message to /ai/query
router.post('/query', handleAiQuery);

module.exports = router;
     