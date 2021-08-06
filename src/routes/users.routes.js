const express = require('express')
const passport = require('passport')

const UsersService = require('../services/users.service')
const validationHandler = require('../utils/middlewares/validationHandler')
const {
    createUserSchema,
    userIdSchema,
    updateUserSchema,
} = require('../utils/schemas/users')

require('../utils/auth/strategies/jwt')

function usersApi(app) {
    const router = express.Router()
    app.use('/api/users', router)

    const usersService = new UsersService()

    router.get(
        '/',
        passport.authenticate('jwt', { session: false }),
        async function (req, res, next) {
            try {
                const users = await usersService.getUsers()
                res.status(200).json({
                    data: users,
                    message: 'users listed',
                })
            } catch (error) {
                next(error)
            }
        }
    )

    router.get(
        '/:userId',
        passport.authenticate('jwt', { session: false }),
        validationHandler({ userId: userIdSchema }),
        async function (req, res, next) {
            const { userId } = req.params
            try {
                const user = await usersService.getUserById({ userId })
                res.status(200).json({
                    data: user,
                    message: 'user retrieved',
                })
            } catch (error) {
                next(error)
            }
        }
    )

    router.post(
        '/',
        passport.authenticate('jwt', { session: false }),
        validationHandler(createUserSchema),
        async function (req, res, next) {
            const { body: user } = req
            const { email } = user
            try {
                const userEmail = await usersService.getUser({ email })
                if (userEmail) {
                    return res.status(205).json({
                        message: 'email is already exists',
                    })
                }
                const createdUserId = await usersService.createUser({ user })
                res.status(201).json({
                    data: createdUserId,
                    message: 'user created',
                })
            } catch (error) {
                next(error)
            }
        }
    )

    router.put(
        '/:userId',
        passport.authenticate('jwt', { session: false }),
        // validationHandler({ userId: userIdSchema }),
        validationHandler(updateUserSchema),
        async function (req, res, next) {
            const { userId } = req.params
            const { body: user } = req
            console.log(userId, user)
            try {
                const updatedUserId = await usersService.updateUser({
                    userId,
                    user,
                })
                res.status(200).json({
                    data: updatedUserId,
                    message: 'user updated',
                })
            } catch (error) {
                next(error)
            }
        }
    )

    router.delete(
        '/:userId',
        passport.authenticate('jwt', { session: false }),
        validationHandler({ userId: userIdSchema }),
        async function (req, res, next) {
            const { userId } = req.params
            try {
                const deletedUserId = await usersService.deleteUser({
                    userId,
                })
                res.status(200).json({
                    data: deletedUserId,
                    message: 'user deleted',
                })
            } catch (error) {
                next(error)
            }
        }
    )
}

module.exports = usersApi
