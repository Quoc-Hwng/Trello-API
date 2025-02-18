import { StatusCodes } from "http-status-codes"
import { boardModel } from "../models/boardModel"
import ApiError from "../utils/ApiError"
import { slugify } from "../utils/formatters"
import { cloneDeep } from "lodash"
import { columnModel } from "../models/columnModel"
import { cardModel } from "../models/cardModel"

const createNew = async (reqBody) => {
    try {
        const newBoard = {
            ...reqBody,
            slug: slugify(reqBody.title)
        }

        const createdBoard = await boardModel.createNew(newBoard)

        const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
        return getNewBoard
    } catch (error) {
        throw error
    }
}
const getDetails = async (boardId) => {
    try {
        const board = await boardModel.getDetails(boardId)

        if (!board) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
        }

        const resBoard = cloneDeep(board)
        resBoard.columns.forEach(column => {
            //JS
            // column.cards = resBoard.cards.filter(card => card.columnId.toString() === column._id.toString())
            //MongoDb
            column.cards = resBoard.cards.filter(card => card.columnId.equals(column._id))
        })

        delete resBoard.cards

        return resBoard
    } catch (error) {
        throw error
    }
}

const update = async (boardId, reqBody) => {
    try {
        const updateData = {
            ...reqBody,
            updatedAt: Date.now()
        }
        const updatedBoard = await boardModel.update(boardId, updateData)

        return updatedBoard
    } catch (error) {
        throw error
    }
}

const moveCardToDifferentColumn = async (reqBody) => {
    try {
        //Update cardOrderIds prev Column (Delete _id Card)
        await columnModel.update(reqBody.prevColumnId, {
            cardOrderIds: reqBody.prevCardOrderIds,
            updatedAt: Date.now()
        })

        //(Add _id Card next Column)
        await columnModel.update(reqBody.nextColumnId, {
            cardOrderIds: reqBody.nextCardOrderIds,
            updatedAt: Date.now()
        })
        //Update new columnId of card
        await cardModel.update(reqBody.currentCardId, {
            columnId: reqBody.nextColumnId
        })

        return { updatedBoard: 'Successfully' }
    } catch (error) {
        throw error
    }
}

export const boardService = {
    createNew,
    getDetails,
    update,
    moveCardToDifferentColumn
}