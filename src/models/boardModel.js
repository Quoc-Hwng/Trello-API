import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '../config/mongodb'
import { ObjectId } from 'mongodb'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { userModel } from '~/models/userModel'
import { BOARD_TYPES } from '../utils/constants'
import { pagingSkipValue } from '../utils/algorithms'

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    slug: Joi.string().required().min(3).trim().strict(),
    description: Joi.string().required().min(3).max(256).trim().strict(),
    type: Joi.string().valid(...Object.values(BOARD_TYPES)).required(),

    columnOrderIds: Joi.array().items(
        Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ).default([]),

    ownerIds: Joi.array().items(
        Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ).default([]),

    memberIds: Joi.array().items(
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

const createNew = async (userId, data) => {
    try {
        const validData = await validateBeforeCreate(data)
        const newBoardToAdd = {
            ...validData,
            ownerIds: [new ObjectId(String(userId))]
        }
        return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(newBoardToAdd)
    } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
    } catch (error) { throw new Error(error) }
}
const getDetails = async (userId, boardId) => {
    try {
        const queryConditions = [
            { _id: new ObjectId(String(boardId)), },
            { _destroy: false },
            {
                $or: [
                    { ownerIds: { $all: [new ObjectId(String(userId))] } },
                    { memberIds: { $all: [new ObjectId(String(userId))] } }
                ]
            }
        ]
        const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
            {
                $match: {
                    $and: queryConditions
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
            },
            {
                $lookup: {
                    from: userModel.USER_COLLECTION_NAME,
                    localField: 'ownerIds',
                    foreignField: '_id',
                    as: 'owners',
                    pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
                }
            },
            {
                $lookup: {
                    from: userModel.USER_COLLECTION_NAME,
                    localField: 'memberIds',
                    foreignField: '_id',
                    as: 'members',
                    pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
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
                delete updateData[fieldName]
            }
        })
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(String(boardId)) },
            { $set: updateData },
            { returnDocument: 'after' }
        )
    } catch (error) { throw new Error(error) }
}

const getBoards = async (userId, page, itemsPerPage) => {
    try {
        const queryConditions = [
            { _destroy: false },

            {
                $or: [
                    { ownerIds: { $all: [new ObjectId(String(userId))] } },
                    { memberIds: { $all: [new ObjectId(String(userId))] } }
                ]
            }
        ]
        const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
            { $match: { $and: queryConditions } },
            { $sort: { title: 1 } },
            //handle nhiều luồng trong 1 query
            {
                $facet: {
                    //Query board
                    'queryBoards': [
                        { $skip: pagingSkipValue(page, itemsPerPage) },
                        { $limit: itemsPerPage }
                    ],
                    //Query đếm tổng tất cả số lượng bản ghi board trong DB trả về
                    'queryTotalBoards': [{ $count: 'countedAllBoards' }]
                }
            }
        ],//fix B hoa dung truoc a thuong
            { collation: { locale: 'en' } }
        ).toArray()

        const res = query[0]

        return {
            boards: res.queryBoards || [],
            totalBoards: res.queryTotalBoards[0]?.countedAllBoards || 0
        }
    } catch (error) { throw new Error(error) }
}

const pushMemberIds = async (boardId, userId) => {
    try {
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(String(boardId)) },
            { $push: { memberIds: new ObjectId(String(userId)) } },
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
    update,
    getBoards,
    pushMemberIds
}