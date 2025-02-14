import express from 'express'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'

const START_SERVER = () => {

    const app = express()

    app.get('/', function (req, res) {
        res.send('Hehe')
    })

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