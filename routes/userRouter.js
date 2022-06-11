const express = require('express');
const { route } = require('express/lib/application');
const authController = require('../controllers/authController')

const router = express.Router();

router.get('/me', authController.protect, authController.me)
router.get('/checkaccess/:docId', authController.protect, authController.checkAccess)

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.protect, authController.logout)

router.post('/forgotpassword', authController.forgotPassword)
router.patch('/resetpassword/:token', authController.resetPassword)
router.patch('/updatepassword', authController.protect, authController.updatePassword)

module.exports = router