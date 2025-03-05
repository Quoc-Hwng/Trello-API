import { StatusCodes } from "http-status-codes"
import ApiError from "../utils/ApiError"
import { boardModel } from "../models/boardModel"
import { pickUser } from "../utils/formatters"
import { invitationModel } from "../models/invitationModel"
import { userModel } from "../models/userModel"
import { BOARD_INVITATION_STATUS, INVITATION_TYPES } from "../utils/constants"

const createNewBoardInvitation = async (inviterId, reqBody) => {
    try {
        const inviter = await userModel.findOneById(inviterId)

        const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)

        const board = await boardModel.findOneById(reqBody.boardId)

        if (!invitee || !inviter || !board) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Email not found')
        }

        const newInvitationData = {
            inviterId,
            inviteeId: invitee._id.toString(),
            type: INVITATION_TYPES.BOARD_INVITATION,
            boardInvitation: {
                boardId: board._id.toString(),
                status: BOARD_INVITATION_STATUS.PENDING
            }
        }

        const createdInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)

        const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId)


        const resInvitation = {
            ...getInvitation,
            board,
            inviter: pickUser(inviter),
            invitee: pickUser(invitee)
        }
        return resInvitation
    } catch (error) {
        throw error
    }
}

const getInvitations = async (userId) => {
    try {
        const getInvitations = await invitationModel.findByUser(userId)
        const resInvitation = getInvitations.map((i) => {
            return {
                ...i,
                inviter: i.inviter[0] || {},
                invitee: i.invitee[0] || {},
                board: i.board[0] || {}
            }
        })
        return resInvitation
    } catch (error) { throw error }
}

const updateBoardInvitation = async (userId, invitationId, status) => {
    try {
        const getInvitation = await invitationModel.findOneById(invitationId)
        if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')

        const boardId = getInvitation.boardInvitation.boardId
        const getBoard = await boardModel.findOneById(boardId)
        if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

        const boardOwnerAndMemberIds = [...getBoard.ownerIds, ...getBoard.memberIds].toString()
        if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId)) {
            throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board')
        }
        const updateData = {
            boardInvitation: {
                ...getInvitation.boardInvitation,
                status: status
            }
        }
        const updatedInvitation = await invitationModel.update(invitationId, updateData)

        if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
            await boardModel.pushMemberIds(boardId, userId)
        }

        return updatedInvitation
    } catch (error) { throw error }
}

export const invitationService = {
    createNewBoardInvitation,
    getInvitations,
    updateBoardInvitation
}