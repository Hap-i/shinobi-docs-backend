const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required !']
    },
    email: {
        type: String,
        required: [true, 'Email is required !'],
        unique: [true, 'This email is already used'],
        lowercase: [true, 'password must be atleast 8 chars long'],
        validate: [validator.isEmail, 'Please provide a correct Email']

    },
    photo: String,
    password: {
        type: String,
        required: [true, 'Password is Required !'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Password is Required !'],
        validate: {
            // this only works on CREATE and SAVE
            validator: function (el) {
                return el === this.password
            },
            message: 'password and confirm password do not match.'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

// Encrypt password
userSchema.pre('save', async function (next) {
    // only runs when password is modified
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12)

    this.passwordConfirm = undefined;
    next();
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    // sometimes JWT creation is faster than saving the password at database
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, async function (next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        return JWTTimestamp < changedTimestamp
    }

    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // console.log(resetToken, this.passwordResetToken)
    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User;