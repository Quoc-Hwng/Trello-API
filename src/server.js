import express from 'express'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import exitHook from 'async-exit-hook'

const START_SERVER = () => {

    const app = express()

    const hostname = 'localhost'
    const port = 4000

    app.get('/', function (req, res) {
        res.send('Hehe')
    })

    app.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}`)
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