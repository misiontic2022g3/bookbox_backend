const passport = require('passport')
const { BasicStrategy } = require('passport-http')
const boom = require('@hapi/boom')
const bcrypt = require('bcrypt')

const UserService = require('../../../services/users.service')

passport.use(
    new BasicStrategy(async function (email, password, done) {
        const userService = new UserService()
        try {
            
            const user = await userService.getUser({ email })

            if (!user) {
                return done(boom.unauthorized('Usuario no encontrado'), false)
            }

            if (!(await bcrypt.compare(password, user.password))) {
                return done(boom.unauthorized('Error en contraseña'), false)
            }

            delete user.password

            return done(null, user)
        } catch (error) {
            return done(error)
        }
    })
)
