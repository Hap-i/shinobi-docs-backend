const express = require('express');
const { createNewDocument, getAllDocuments } = require('../controllers/docController');
const authController = require('../controllers/authController')

const router = express.Router();

router
    .route('/')
    .post(authController.protect, createNewDocument)
    .get(authController.protect, getAllDocuments)

module.exports = router