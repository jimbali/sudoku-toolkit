import * as mongoDB from 'mongodb'
import * as dotenv from 'dotenv'

export const collections: { puzzles?: mongoDB.Collection } = {}

export async function connectToDatabase() {
  dotenv.config()

  const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.MONGODB_URL!)
          
  await client.connect()
      
  const db: mongoDB.Db = client.db('sudoku')
  const puzzlesCollection: mongoDB.Collection = db.collection('puzzles')

  collections.puzzles = puzzlesCollection
     
  console.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${puzzlesCollection.collectionName}`
  )
}