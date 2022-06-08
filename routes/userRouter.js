const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router();

router.get('/me', authController.protect, authController.me)

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.post('/forgotpassword', authController.forgotPassword)
router.patch('/resetpassword/:token', authController.resetPassword)
router.patch('/updatepassword', authController.protect, authController.updatePassword)

module.exports = router