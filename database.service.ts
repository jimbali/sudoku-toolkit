import * as mongoDB from 'mongodb'

export const collections: { puzzles?: mongoDB.Collection } = {}

export async function connectToDatabase () {
  const client: mongoDB.MongoClient = new mongoDB.MongoClient('mongodb://127.0.0.1:27017')
          
  await client.connect()
      
  const db: mongoDB.Db = client.db('sudoku')
  const puzzlesCollection: mongoDB.Collection = db.collection('puzzles')

  collections.puzzles = puzzlesCollection
     
  console.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${puzzlesCollection.collectionName}`
  )
}