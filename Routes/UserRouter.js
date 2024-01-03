const express = require('express')
const userController = require('../Controllers/UserController')
const authController = require('../Controllers/authController');

const router = express.Router();

router.post('/signup', authController.userSignup)
router.post('/login', authController.userLogin)

router.get('/me', authController.protect, userController.getMe, userController.getUser)

router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)
router.patch('/updateMyPassword', authController.protect, authController.updatePassword)

router.patch('/updateMe', authController.protect, userController.updateMe)
router.delete('/deleteMe', authController.protect, userController.deleteMe)

router.route('/').get(userController.getAllUsers).put(userController.addUser)
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser)

module.exports = router