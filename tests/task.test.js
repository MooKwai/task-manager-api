const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const {
    userOneId,
    userTwoId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    populateDatabase
} = require('./fixtures/db')

beforeEach(populateDatabase)

test('should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Hoovering'
        })
        .expect(201)

    const task = await Task.findById(response.body.data._id)
    expect(task).not.toBeNull()

    expect(task.completed).toBe(false)
})

test('should not create task with invalid description', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: '',
            completed: true
        })
        .expect(400)
})

test('should not create task with invalid completed state', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Wash the car',
            completed: 'not yet'
        })
        .expect(400)
})

test('should fetch tasks for a user', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body.data.length).toBe(2)
})

test('should fetch uncompleted tasks only', async () => {
    const response = await request(app)
        .get('/tasks?completed=false')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.data.length).toBe(1)
    expect(response.body.data[0]).toMatchObject({
        description: taskOne.description
    })
})

test('should fetch completed tasks only', async () => {
    const response = await request(app)
        .get('/tasks?completed=true')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.data.length).toBe(1)
    expect(response.body.data[0]).toMatchObject({
        description: taskTwo.description
    })
})

test('should fetch user task by id', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    const task = await Task.findById(taskOne._id)
    expect(response.body.data.description).toBe(task.description)
})

test('should not fetch user task by id if not authenticated', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)
})

test('should not fetch other user\'s task by id', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
})

test('should sort fetched tasks by description', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=description_asc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.data.length).toBe(2)
    expect(response.body.data[0].description).toBe(taskTwo.description)
    expect(response.body.data[1].description).toBe(taskOne.description)
})

test('should sort fetched tasks by completed', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=completed_asc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.data.length).toBe(2)
    expect(response.body.data[0].description).toBe(taskOne.description)
    expect(response.body.data[1].description).toBe(taskTwo.description)
})

test('should fetch page of tasks', async () => {
    const response = await request(app)
        .get('/tasks?sortBy=completed&limit=1&skip=1')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.data[0].description).toBe(taskTwo.description)
})

test('should update task', async () => {
    const response = await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Hoovering',
            completed: true
        })
        .expect(200)

    const task = await Task.findById(taskOne._id)
    expect(task.description).toBe('Hoovering')
})

test('should not update task with invalid description', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            finished: true
        })
        .expect(400)
})

test('should not update task with empty description', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: ''
        })
        .expect(400)

    const task = await Task.findById(taskOne._id)
    expect(task.description).toBe(taskOne.description)
})

test('should not update other users task', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send({
            completed: true
        })
        .expect(404)

    const task = await Task.findById(taskOne._id)
    expect(task.completed).toBe(false)
})

test('should not delete other user\'s tasks', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

test('should delete user task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const task = await Task.findById(taskOne._id)
    expect(task).toBeNull()
})

test('should not delete task if unauthenticated', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)

    const task = Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

test('should not delete other user\'s task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})
