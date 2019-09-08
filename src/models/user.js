const mongoose = require('mongoose')
const validator = require('validator')

const User = mongoose.model('User', {
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (validator.contains(value.toLowerCase(), 'password')) {
                throw new Error('Password contains the word "password"')
            }
        }
    },
    age: {
        type: Number,
        validate(value) {
            if (!validator.isInt(value, { min: 0 })) {
                throw new Error('Invalid age')
            }
        }
    }
})

module.exports = User
