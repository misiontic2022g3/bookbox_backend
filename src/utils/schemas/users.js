const joi = require('@hapi/joi')

const userIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/)

const userSchema = {
    firstName: joi.string().min(3).max(100).required(),
    lastName: joi.string().min(3).max(100).required(),
    email: joi.string().email().required(),
    password: joi.string().min(4).required(),
}

const createUserSchema = {
    ...userSchema,
    isAdmin: joi.boolean(),
}

const updateUserSchema = {
    firstName: joi.string().min(3).max(100),
    lastName: joi.string().min(3).max(100),
    email: joi.string().email(),
    password: joi.string().min(4),
    isAdmin: joi.boolean(),
}

const createProviderUserSchema = {
    ...userSchema,
    apiKeyToken: joi.string().required(),
}

module.exports = {
    userIdSchema,
    createUserSchema,
    updateUserSchema,
    createProviderUserSchema,
}
