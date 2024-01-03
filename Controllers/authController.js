const { promisify, isNullOrUndefined } = require('util');
const { default: mongoose } = require('mongoose');
const User = require('../Models/userModel');
const jwt = require('jsonwebtoken');
const { decode } = require('punycode');
const sendEmail = require('../Utils/EmailHandler');
const crypto = require('crypto')

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_TOKEN_EXPIRY,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_TOKEN_EXPIRY * 24 * 60 * 60 * 1000),
        // secure: true, // COokie wil only be sent over HTTPS requests
        httpOnly: true // Modifying the cookie is not allowed
    })

    // Prevent user password from displaying while creating new user
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.userSignup = async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);
        // name: req.body.name,
        // email: req.body.email,
        // password: req.body.password,
        // passwordConfirm: req.body.passwordConfirm,
        // passwordChangedAt: req.body.passwordChangedAt,
        // role: req.body.role,
        // passwordResetToken: req.body.passwordResetToken,
        // passwordResetExpires: req.body.passwordResetExpires

        createSendToken(newUser, 201, res)
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: `The user could not be created because: ${err}`,
        });
    }
};

exports.userLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            res.status(400).json({
                status: 'fail',
                message: 'Please enter email and password',
            });
            return next();
        }

        // use +fieldName to select fields that have select option as false
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.confirmPassword(password, user.password))) {
            res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password',
            });
            return next();
        }

        createSendToken(user, 200, res)
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.protect = async (req, res, next) => {
    try {
        let token;
        // 1. Getting token and checking if it is there
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to get access',
            });
            return next();
        }
        console.log('Protect Token: ', token);

        // 2. Verifying token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        console.log(decoded);

        // 3. Check if user still exists
        const freshUser = await User.findById(decoded.id);
        if (!freshUser) {
            res.status(401).json({
                status: 'fail',
                message: 'The user no longer exists',
            });
        }

        // 4. Check if password has changed
        if (freshUser.changedPasswordAfter(decoded.iat)) {
            res.status(401).json({
                status: 'fail',
                message: 'Password has recently changed. Please login again',
            });
            return next();
        }

        // Grant access to protected route. *1
        req.user = freshUser;
        next();
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.authorizeTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array -> ['admin', 'lead-guide]
        // look at *1
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to do this action',
            });
            return next();
        }
        next();
    };
};

exports.forgotPassword = async (req, res, next) => {
    try {
        // 1. Get user based on posted email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(404).json({
                status: 'fail',
                message: 'No user with this email address exists in the database',
            });
            return next();
        }

        // Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Send it to user's email
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;
        const message = `Forgot your password? Go to this site to register a new password. 
        Link: ${resetURL}.\n If you didn't forget you password, ignore this message`;

        try {
            await sendEmail({
                email: req.body.email,
                subject: 'Your password reset token (Valid for 10 minutes)',
                message,
            })

            res.status(200).json({
                status: 'success',
                message: 'Token sent to email'
            })
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false })

            res.status(500).json({
                status: 'fail',
                message: 'There was an error in trying to send the mail. Please try again later'
            })
            return next();

        }
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.resetPassword = async (req, res, next) => {
    try {

        // 1. Get user based on token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        })

        // 2. If token has not expired and there is a user, set the new password
        if (!user) {
            res.status(404).json({
                status: 'fail',
                message: "Token is invalid or has expired"
            })
            return next()
        }

        user.password = req.body.password
        user.passwordConfirm = req.body.passwordConfirm
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save()

        // 4. LogIn the user, send JWT
        createSendToken(user, 200, res)
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        // 1. Get user from database & Check if posted password is correct
        const user = await User.findById(req.user.id).select('+password')

        // 2. Check if POSTed current password is correct
        if (!(await user.confirmPassword(req.body.passwordCurrent, user.password))) {
            res.status(401).json({
                status: 'fail',
                message: 'Your entered password does not match with the password in the DB'
            })
            return next()
        }

        // 3. Update password if everything is fine
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm
        await user.save();

        // 4. Send token to login
        // const token = signToken(user._id)
        // res.status(200).json({
        //     status: 'success',
        //     token
        // })
        createSendToken(user, 200, res)
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}