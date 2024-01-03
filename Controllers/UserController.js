const User = require("../Models/userModel")

const filterObj = (obj, ...filterFields) => {
    const filteredFieldsArray = {};
    Object.keys(obj).forEach(el => {
        if (filterFields.includes(el)) {
            filteredFieldsArray[el] = obj[el]
        }
    })
    return filteredFieldsArray;
}
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()

        res.status(200).json({
            status: 'success',
            data: { users }
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        })
    }
}

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        console.log(req.user)
        if (!user) {
            res.status(404).json({
                status: 'fail',
                message: 'No user found'
            })
        }

        res.status(200).json({
            status: 'success',
            user
        })
    } catch (err) {
        console.log(err)
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}

exports.updateMe = async (req, res, next) => {
    try {
        // 1. Check if user is trying to update password field. If yes, stop the user
        if (req.body.password || req.body.passwordConfirm) {
            res.status(400).json({
                status: 'fail',
                message: 'To change password, visit /updateMyPassword'
            })
        }

        // 2. Filtered out unwanted field names that are not allowed to be updated
        const filteredBody = filterObj(req.body, 'name', 'email');

        // 3. Update the user data
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}

exports.deleteMe = async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
}

exports.updateUser = (req, res, next) => { }

exports.deleteUser = (req, res) => {
    res.status(500).json({ // status-code -> 500 represents internal server error
        status: "error",
        message: "This route has not been defined yet"
    })
}

exports.addUser = (req, res) => {
    res.status(500).json({ // status-code -> 500 represents internal server error
        status: "error",
        message: "This route has not been defined yet"
    })
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next();
}