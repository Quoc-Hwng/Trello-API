import { StatusCodes } from "http-status-codes"
import ApiError from "../utils/ApiError"
import { JwtProvider } from "../providers/JwtProvider"
import { env } from "../config/environment"

const isAuthorized = async (req, res, next) => {
    const clientAccessToken = req.cookies?.accessToken
    if (!clientAccessToken) {
        next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)'))
        return
    }

    try {
        const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)

        req.jwtDecoded = accessTokenDecoded

        next()
    } catch (error) {
        if (error?.message?.includes('jwt expired')) {
            next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
            return
        }

        next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
    }
}

export const authMiddleware = { isAuthorized }