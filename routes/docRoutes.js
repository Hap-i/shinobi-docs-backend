const express = require('express');
const { createNewDocument, getAllDocuments, shareDocument } = require('../controllers/docController');
const authController = require('../controllers/authController')

const router = express.Router();

router
    .route('/')
    .post(authController.protect, createNewDocument)
    .get(authController.protect, getAllDocuments)

router.post('/share/:docId', authController.protect, shareDocument)

module.exports = router