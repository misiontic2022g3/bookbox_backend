const passport = require('passport')
const { Strategy, ExtractJwt } = require('passport-jwt')
const boom = require('@hapi/boom')

const UsersService = require('../../../services/users.service')
const { config } = require('../../../config')

passport.use(
    new Strategy(
        {
            secretOrKey: config.authJwtSecret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        },
        async function (tokenPayload, done) {

            const usersService = new UsersService()
            
            try {
                const user = await usersService.getUser({
                    email: tokenPayload.email,
                })

                if (!user) {
                    return done(boom.unauthorized(), false)
                }

                delete user.passport

                return done(null, { ...user, scopes: tokenPayload.scopes })
            } catch (error) {
                return done(error)
            }
        }
    )
)
