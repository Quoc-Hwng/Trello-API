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

export const invitationService = {
    createNewBoardInvitation,
    getInvitations
}