const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, populateDatabase } = require('./fixtures/db')

beforeEach(populateDatabase)

test('should sign up a new user', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'Greg',
            email: 'greg.davidson@example.com',
            password: 'strongPwD39$845&***^7398'
        })
        .expect(201)

    const user = await User.findById(response.body.data.user._id)
    expect(user).not.toBeNull()

    expect(response.body.data.user.name).toBe('Greg')
    expect(response.body.data).toMatchObject({
        user: {
            name: 'Greg',
            email: 'greg.davidson@example.com'
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('strongPwD39$845&***^7398')
})

test('should not sign up user with invalid name', async () => {
    await request(app)
        .post('/users')
        .send({
            name: '',
            email: 'geoff@example.com',
            password: 'kejdh897987ergne'
        })
        .expect(400)
})

test('should not sign up user with invalid email', async () => {
    await request(app)
        .post('/users')
        .send({
            name: 'Geoff',
            email: 'geoff@example',
            password: 'kejdh897987ergne'
        })
        .expect(400)
})

test('should not sign up user with invalid password', async () => {
    await request(app)
        .post('/users')
        .send({
            name: 'Geoff',
            email: 'geoff@example.com',
            password: ''
        })
        .expect(400)
})

test('should not sign up user with weak password', async () => {
    await request(app)
        .post('/users')
        .send({
            name: 'Geoff',
            email: 'geoff@example.com',
            password: 'paSSWord123!'
        })
        .expect(400)
})

test('should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))

})

test('should log in existing user', async () => {
    const response = await request(app)
        .post('/users/login')
        .send({
            email: userOne.email,
            password: userOne.password
        })
        .expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.data.token).toMatch(user.tokens[1].token)
})

test('should not log in nonexistant user', async () => {
    await request(app)
        .post('/users/login')
        .send({
            email: 'notauser@example.com',
            password: 'ThoughtISignedUp'
        })
        .expect(400)
})

test('should not log in with missing password', async () => {
    await request(app)
        .post('/users/login')
        .send({
            email: userOne.email
        })
        .expect(400)
})

test('should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Greg'
        })
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.name).toBe('Greg')
})

test('should not update if not authenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: 'Greg'
        })
        .expect(401)
})

test('should not update user with invalid name', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: '',
            email: 'geoff@example.com',
            password: 'kejdh897987ergne'
        })
        .expect(400)
})

test('should not update user with invalid email', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Geoff',
            email: 'geoff@example',
            password: 'kejdh897987ergne'
        })
        .expect(400)
})

test('should not update user with invalid password', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Geoff',
            email: 'geoff@example.com',
            password: ''
        })
        .expect(400)
})

test('should not update user with weak password', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Geoff',
            email: 'geoff@example.com',
            password: 'paSSWord123!'
        })
        .expect(400)
})

test('should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Bath, UK'
        })
        .expect(400)
})

test('should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('should not delete for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})
