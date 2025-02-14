import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'

const createNew = async (req, res, next) => {
    const correctCondition = Joi.object({
        title: Joi.string().required().min(3).max(50).trim().strict().messages(),
        description: Joi.string().required().min(3).max(256).trim().strict(),
    })
    try {
        console.log(req.body)
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        // next()
        res.status(StatusCodes.CREATED).json({ message: 'Create new board' })
    } catch (error) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            errors: new Error(error).message
        })
    }
}

export const boardValidation = {
    createNew
}