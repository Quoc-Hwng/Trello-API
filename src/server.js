import express from 'express'
import cors from 'cors'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { APIs_V1 } from './routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'

const START_SERVER = () => {

    const app = express()

    //Fix Cache from Disk
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store')
        next()
    })

    app.use(cookieParser())

    app.use(cors(corsOptions))

    //Enable req.body json data
    app.use(express.json())

    app.use('/v1', APIs_V1)

    //Middleware
    app.use(errorHandlingMiddleware)

    if (env.BUILD_MODE === 'production') {
        app.listen(process.env.PORT, () => {
            console.log(`Server running at ${process.env.APP_PORT}`)
        })
    } else {

        app.listen(env.APP_PORT, env.APP_HOST, () => {
            console.log(`Server running at http://${env.APP_HOST}:${env.APP_PORT}`)
        })
    }


    //cleanup
    exitHook((signal) => {
        CLOSE_DB()
    })
}

CONNECT_DB()
    .then(() => console.log('Connect to MongoDB Cloud Atlas!'))
    .then(() => START_SERVER())
    .catch(error => {
        console.error(error)
        process.exit(0)
    })