import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '../config/mongodb'
import { ObjectId } from 'mongodb'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { BOARD_TYPES } from '../utils/constants'

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    slug: Joi.string().required().min(3).trim().strict(),
    description: Joi.string().required().min(3).max(256).trim().strict(),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

    columnOrderIds: Joi.array().items(
        Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ).default([]),

    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
    return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validData)
    } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
    } catch (error) { throw new Error(error) }
}
const getDetails = async (id) => {
    try {
        const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
            {
                $match: {
                    _id: new ObjectId(String(id)),
                    _destroy: false
                }
            }, {
                $lookup: {
                    from: columnModel.COLUMN_COLLECTION_NAME,
                    localField: '_id',
                    foreignField: 'boardId',
                    as: 'columns'
                }
            }, {
                $lookup: {
                    from: cardModel.CARD_COLLECTION_NAME,
                    localField: '_id',
                    foreignField: 'boardId',
                    as: 'cards'
                }
            }
        ]).toArray()

        return result[0] || null
    } catch (error) { throw new Error(error) }
}

const pushColumnOrderIds = async (column) => {
    try {
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(String(column.boardId)) },
            { $push: { columnOrderIds: new ObjectId(String(column._id)) } },
            //trả về bản ghi đã được cập nhật
            { returnDocument: 'after' }
        )
    } catch (error) { throw new Error(error) }
}
//Kéo 1 phần tử ra khỏi mảng
const pullColumnOrderIds = async (column) => {
    try {
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(String(column.boardId)) },
            { $pull: { columnOrderIds: new ObjectId(String(column._id)) } },
            { returnDocument: 'after' }
        )
    } catch (error) { throw new Error(error) }
}

const update = async (boardId, updateData) => {
    try {
        updateData.columnOrderIds = updateData.columnOrderIds.map(id => new ObjectId(String(id)))
        Object.keys(updateData).forEach(fieldName => {
            if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
                delete updateData(fieldName)
            }
        })
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(String(boardId)) },
            { $set: updateData },
            { returnDocument: 'after' }
        )
    } catch (error) { throw new Error(error) }
}

export const boardModel = {
    BOARD_COLLECTION_NAME,
    BOARD_COLLECTION_SCHEMA,
    createNew,
    findOneById,
    getDetails,
    pushColumnOrderIds,
    pullColumnOrderIds,
    update
}