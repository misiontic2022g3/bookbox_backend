const express = require('express')
const passport = require('passport')
const boom = require('@hapi/boom')
const jwt = require('jsonwebtoken')

const ApiKeysService = require('../services/apiKeys.service')
const UsersService = require('../services/users.service')
const validationHandler = require('../utils/middlewares/validationHandler')

const {
    createUserSchema,
    createProviderUserSchema,
} = require('../utils/schemas/users')
const { config } = require('../config')

require('../utils/auth/strategies/basic')
require('../utils/auth/strategies/jwt')

function authApi(app) {
    const router = express.Router()
    app.use('/api/auth', router)

    const usersService = new UsersService()
    const apiKeysService = new ApiKeysService()

    router.post('/sign-in', async function (req, res, next) {
        const { apiKeyToken } = req.body

        if (!apiKeyToken) {
            next(boom.unauthorized('apiKeyToken es requerida'), false)
        }

        passport.authenticate('basic', function (error, user) {
            try {
                if (error || !user) {
                    next(boom.unauthorized(error), false)
                }

                req.login(user, { session: false }, async function (error) {
                    if (error) {
                        next(error)
                    }

                    const apiKey = await apiKeysService.getApiKey({
                        token: apiKeyToken,
                    })

                    if (!apiKey) {
                        next(
                            boom.unauthorized('Hay problemas con tus permisos')
                        )
                    }

                    const { _id, firstName, lastName, email, isAdmin } = user

                    const payload = {
                        sub: _id,
                        firstName,
                        lastName,
                        email,
                        isAdmin,
                        scopes: apiKey.scopes,
                    }

                    const token = jwt.sign(payload, config.authJwtSecret, {
                        expiresIn: '15m',
                    })

                    return res.status(200).json({
                        token,
                        user: { _id, firstName, lastName, email, isAdmin },
                    })
                })
            } catch (error) {
                next(error)
            }
        })(req, res, next)
    })

    router.post(
        '/sign-up',
        validationHandler(createProviderUserSchema),
        async function (req, res, next) {
            const { apiKeyToken, firstName, lastName, email, password } =
                req.body
            const user = {
                firstName,
                lastName,
                email,
                password,
            }

            try {
                const userEmail = await usersService.getUser({ email })

                if (userEmail) {
                    return next(boom.unauthorized('El email ya existe'))
                    
                }

                const createdUserId = await usersService.createUser({ user })

                const apiKey = await apiKeysService.getApiKey({
                    token: apiKeyToken,
                })

                if (!apiKey) {
                    return next(boom.unauthorized('Hay problemas con tus permisos'))
                }

                const payload = {
                    sub: createdUserId,
                    firstName,
                    lastName,
                    email,
                    isAdmin: false,
                    scopes: apiKey.scopes,
                }

                const token = jwt.sign(payload, config.authJwtSecret, {
                    expiresIn: '15m',
                })

                return res.status(201).json({
                    token,
                    user: {
                        _id: createdUserId,
                        firstName,
                        lastName,
                        email,
                        isAdmin: false,
                    },
                    message: 'user created',
                })
            } catch (error) {
                next(error)
            }
        }
    )

    router.post(
        '/verify-token',
        passport.authenticate('jwt', { session: false }),
        async function (req, res, next) {
            const { _id, firstName, lastName, email, isAdmin, scopes } =
                req.user
            try {
                const payload = {
                    sub: _id,
                    firstName,
                    lastName,
                    email,
                    isAdmin,
                    scopes,
                }

                const token = jwt.sign(payload, config.authJwtSecret, {
                    expiresIn: '15m',
                })

                return res.status(201).json({
                    token,
                    user: {
                        _id,
                        firstName,
                        lastName,
                        email,
                        isAdmin,
                    },
                    message: 'token verified',
                })
            } catch (error) {
                next(error)
            }
        }
    )

    router.post(
        '/sign-provider',
        validationHandler(createProviderUserSchema),
        async function (req, res, next) {
            const { body } = req

            const { apiKeyToken, ...user } = body

            if (!apiKeyToken) {
                next(boom.unauthorized('apiKeyToken is required'))
            }

            try {
                const queriedUser = await usersService.getOrCreateUser({ user })
                const apiKey = await apiKeysService.getApiKey({
                    token: apiKeyToken,
                })

                if (!apiKey) {
                    next(boom.unauthorized())
                }

                const { _id, firstName, lastName, email } = queriedUser

                const payload = {
                    sub: _id,
                    firstName,
                    lastName,
                    email,
                    scopes: apiKey.scopes,
                }

                const token = jwt.sign(payload, config.authJwtSecret, {
                    expiresIn: '15m',
                })

                return res
                    .status(200)
                    .json({
                        token,
                        user: { _id, firstName, lastName, email },
                        message: 'token updated',
                    })
            } catch (error) {
                next(error)
            }
        }
    )
}

module.exports = authApi
