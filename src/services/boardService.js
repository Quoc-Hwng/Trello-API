import { StatusCodes } from "http-status-codes"
import { boardModel } from "../models/boardModel"
import ApiError from "../utils/ApiError"
import { slugify } from "../utils/formatters"
import { cloneDeep } from "lodash"

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
        console.log(boardId)
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

export const boardService = {
    createNew,
    getDetails
}