const MONGODB_URI = 'mongodb+srv://phamhung151020:4tDZTyHihutKTEVf@cluster0-quochwng.3knt2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-QuocHwng'
const DATABASE_NAME = 'trello-quochwng'

import { MongoClient, ServerApiVersion } from 'mongodb'

let trelloDatabaseInstance = null

const mongoClientInstance = new MongoClient(MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})

export const CONNECT_DB = async () => {
    await mongoClientInstance.connect()

    trelloDatabaseInstance = mongoClientInstance.db(DATABASE_NAME)
}

export const GET_DB = () => {
    if (!trelloDatabaseInstance) throw new Error('Must connect to Database first')
    return trelloDatabaseInstance
}

export const CLOSE_DB = async () => {
    await mongoClientInstance.close()
}