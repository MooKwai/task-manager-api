const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const buildResponse = require('../middleware/response')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

const router = new express.Router()

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please provide an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send(buildResponse(true, 'Profile created', { user, token }))
    } catch (e) {
        if (e.name === 'ValidationError') {
            res.status(400).send(buildResponse(false, 'Profile not valid', e))
        } else {
            res.status(500).send(buildResponse(false, 'Failed to create profile'))
        }
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send(buildResponse(true, 'Logged in', { user, token }))
    } catch (e) {
        res.status(400).send(buildResponse(false, 'Failed to log in'))
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()
        res.status(200).send(buildResponse(true, 'Logged out on this device'))
    } catch (e) {
        res.status(500).send(buildResponse(false, 'Failed to log out on this device'))
    }
})

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send(buildResponse(true, 'Logged out on all devices'))
    } catch (e) {
        res.status(500).send(buildResponse(false, 'Failed to log out on all devices'))
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(buildResponse(true, 'Fetched profile', req.user))
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.entries(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(([key, value]) => {
        return (allowedUpdates.includes(key) && value !== '')
    })

    if (!isValidOperation) {
        return res.status(400).send(buildResponse(false, 'Invalid update', req.body))
    }

    try {
        updates.forEach(([key, value]) => req.user[key] = req.body[key])

        await req.user.save()

        res.status(200).send(buildResponse(true, 'Updated profile', req.user))
    } catch (e) {
        if (e.name === 'ValidationError') {
            res.status(400).send(buildResponse(false, 'Profile not valid', e))
        } else {
            res.status(500).send(buildResponse(false, 'Failed to update profile'))
        }
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.status(200).send(buildResponse(true, 'Deleted profile', req.user))
    } catch (e) {
        res.status(500).send(buildResponse(false, 'Failed to delete profile'))
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.status(200).send(buildResponse(true, 'File saved'))
}, (error, req, res, next) => {
    res.status(400).send(buildResponse(false, 'File not saved', error.message))
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send(buildResponse(true, 'File deleted'))
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(400).send()
    }
})

module.exports = router