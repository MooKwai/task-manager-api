const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const buildResponse = require('../middleware/response')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(buildResponse(true, 'Task created', task))
    } catch (e) {
        if (e.name === 'ValidationException') {
            res.status(400).send(buildResponse(false, 'Task not valid', e))
        } else {
            res.status(500).send(buildResponse(false, 'Failed to create task'))
        }
    }
})

router.get('/tasks', auth, async (req, res) => {
    try {
        await req.user.populate('tasks').execPopulate()
        res.status(200).send(buildResponse(true, 'Fetched tasks', req.user.tasks))
    } catch (e) {
        res.status(500).send(buildResponse(false, 'Failed to fetch tasks'))
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if (!task) {
            return res.status(404).send(buildResponse(false, 'Task not found'))
        }
        res.status(200).send(buildResponse(true, 'Fetched task', task))
    } catch (e) {
        res.status(500).send(buildResponse(false, 'Failed to fetch task'))
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send(buildResponse(false, 'Invalid task'))
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send(buildResponse(false, 'Task not found'))
        }

        updates.forEach(update => task[update] = req.body[update])
        task.save()

        res.status(200).send(buildResponse(true, 'Updated task', task))
    } catch (e) {
        if (e.name === 'ValidationException') {
            res.status(400).send(buildResponse(false, 'Task not valid', e))
        } else {
            res.status(500).send(buildResponse(false, 'Failed to update task'))
        }
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        })

        if (!task) {
            return res.status(404).send(buildResponse(false, 'Task not found'))
        }

        res.status(200).send(buildResponse(true, 'Deleted task', task))
    } catch (e) {
        res.status(500).send(buildResponse(false, 'Failed to delete task'))
    }
})

module.exports = router