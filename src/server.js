import express from 'express'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { APIs_V1 } from './routes/v1'

const START_SERVER = () => {

    const app = express()

    app.use('/v1', APIs_V1)

    app.listen(env.APP_PORT, env.APP_HOST, () => {
        console.log(`Server running at http://${env.APP_HOST}:${env.APP_PORT}`)
    })

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