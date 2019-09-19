const express = require('express')
const mongoose = require('mongoose')
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
        if (e.name === 'ValidationError') {
            res.status(400).send(buildResponse(false, 'Task not valid', e))
        } else {
            res.status(500).send(buildResponse(false, 'Failed to create task'))
        }
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20 (shows third page of 10 results)
// GET /tasks?sortBy={field}_asc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
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
    const updates = Object.entries(req.body)

    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(([key, value]) => {
        return (allowedUpdates.includes(key) && value !== '')
    })

    if (!isValidOperation) {
        return res.status(400).send(buildResponse(false, 'Invalid update'))
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send(buildResponse(false, 'Task not found'))
        }

        updates.forEach(([key, value]) => task[key] = value)
        task.save()

        res.status(200).send(buildResponse(true, 'Updated task', task))
    } catch (e) {
        if (e.name === 'ValidationError') {
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