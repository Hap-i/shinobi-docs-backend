const crypto = require('crypto')
const { promisify } = require('util')
const User = require('./../models/user')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')
const { catchAsync } = require('../utils/catchAsync')
const Mapper = require('../models/Mapper')

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, stausCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        sameSite: "none",
        secure: true,
        httpOnly: true
    }

    res.cookie('jwt', token, cookieOptions)
    user.password = undefined
    res.status(stausCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    })
    console.log(newUser);
    createSendToken(newUser, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('please provide email and password!', 400))
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        // if user is not there then await user.correctPassword(password, user.password) this wont work so added directly
        return next(new AppError('Incorrect Email or Password', 401))
    }

    createSendToken(user, 200, res);
})

exports.logout = (req, res) => {
    res.cookie('jwt', "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        sameSite: "none",
        secure: true,
        httpOnly: true
    })
    res.status(200).json({
        status: "Success"
    })
}

exports.protect = catchAsync(async (req, res, next) => {
    // 1. Gget token and check if it's there
    let token;
    // console.log(req.cookies)
    if (req.cookies.jwt) {
        token = req.cookies.jwt
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // console.log(token)
    if (!token) {
        console.log("inside");
        return next(new AppError('You are not logged in! please log in to get access', 401))
    }

    // 2. Verification of token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3. check if user actually exists
    const freshUser = await User.findById(decode.id)
    if (!freshUser) {
        return next(new AppError('User no longer Exists!', 401))
    }
    // 4.check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decode.iat)) {
        return next(new AppError('Please Login Again', 401))
    }
    req.user = freshUser;
    next();
})

// exports.restrictTo = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return next(new AppError('User Don\'t have enough permission ! ', 403))
//         }
//         next()
//     }
// }

exports.forgotPassword = async (req, res, next) => {
    //1. Get user based on email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email address.', 404))
    }
    // 2. Generate the random reset token
    const resetToken = await user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false })

    //3. send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`
    const message = `Forgot your password? submit a patch request with your new pass and confirm pass to: ${resetURL}.`
    // if some error happens while sending the email handel it
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: 'Success',
            message: 'Password reset link sent to email'
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending Email', 500))

    }
}

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

    // 2. if the token has not expired and user is there then change the password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user -handled in userModel~
    // 4) Log the user in, send JWT
    const token = signToken(user._id)
    res.status(200).json({
        status: "Success",
        token: token,
    })
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password')
    // 2) Check if POSTed current password is correct

    console.log(req.body.passwordCurrent, user.password);
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401))
    }
    // 3) If so, update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()
    // 4) Log user in, send JWT
    const token = signToken(user._id)
    res.status(200).json({
        status: "Success",
        token: token,
    })
})

exports.me = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: "Success",
        data: {
            name: req.user.name,
            email: req.user.email,
            userId: req.user._id
        }
    })
})

exports.checkAccess = catchAsync(async (req, res, next) => {
    const mapObj = await Mapper.findOne({ user: req.user._id, documentId: req.params.docId })
    if (!mapObj) return next(new AppError("You don't have access", 401))
    res.status(200).json({
        status: "Success"
    })
})