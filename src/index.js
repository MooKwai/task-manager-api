const express = require('express')
require('./db/mongoose')
const User = require('./models/user')
const Task = require('./models/task')

const app = express()
const port = process.env.port || 3000

app.use(express.json())

app.listen(port, () => {
    console.log('Server running on ' + port)
})