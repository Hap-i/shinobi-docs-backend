const express = require('express');
const { createNewDocument } = require('../controllers/docController');
const router = express.Router();

router
    .route('/')
    .post(createNewDocument)

module.exports = router