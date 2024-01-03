const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
        lowerCase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['tourist', 'guide', 'lead-guide', 'admin'],
        default: 'tourist'
    },
    passwordChangedAt: {
        type: Date
    },
    password: {
        type: String,
        required: [true, 'A user must have a password'],
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'A user must have a password to confirm'],
        validate: {
            // This works only on SAVE and CREATE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'The entered passwords are not the same.'
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // if password is not modified, skip this middleware.

    this.password = await bcrypt.hash(this.password, 12)
    // 12 represents how CPU intensive the hashing process would be. 10 is default but, newer CPUs could handle 12 with ease

    this.passwordConfirm = undefined; // passwordConfirm is not needeed to be persisted into the database.

    // Set passwordChangedAt to the current date
    // this.passwordChangedAt = new Date();

    next()
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, function (next) {
    // Tis is a query middleware. It points to the current query
    this.find({ active: true });
    next();
})

// Instance method -> it is available to all documents of a certain collection
userSchema.methods.confirmPassword = async function (bodyPassword, correctPassword) {
    // we cannot use this.password here because the password field has select = false.
    return await bcrypt.compare(bodyPassword, correctPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        // console.log(changedTime, JWTTimestamp)
        return JWTTimestamp < changedTime // 100 < 200
    }

    return false; // Password has not changed
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from current time

    console.log({ resetToken }, this.passwordResetToken)
    return resetToken // Returning actual string token because it has to be given to the user via mail.
}

const User = mongoose.model('User', userSchema)

module.exports = User