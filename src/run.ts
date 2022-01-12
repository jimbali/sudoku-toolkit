import { SudokuCreator } from '@algorithm.ts/sudoku'
import { add, any, countBy, curry, filter, flatten, gt, join, map, until, __ } from 'ramda'
import { parseGrid, serializeGrid } from 'sudoku-master'
import solve, { Solution } from './solver'
import { ObjectId } from 'mongodb'
import Logger from './logger'
import * as mongoDb from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config()

const logger = new Logger('info')

type Tally = {
  'Full House'?: number,
  'Last Digit'?: number,
  'Naked Single'?: number,
  'Hidden Single'?: number,
  'Naked Pair'?: number,
  'Naked Triple'?: number,
  'Locked Pair'?: number,
  'Locked Candidates Type 1 (Pointing)'?: number,
  'Locked Candidates Type 2 (Claiming)'?: number,
  'Hidden Pair'?: number,
  'Hidden Triple'?: number,
  'Naked Quadruple'?: number,
  'Hidden Quadruple'?: number,
  'X-Wing'?: number,
  'Swordfish'?: number,
  'Jellyfish'?: number,
  'other'?: number
}

type Puzzle = {
  _id?: ObjectId
  gridString?: string
  solutionString?: string
  solved?: boolean
  tally?: Tally
  intendedDifficulty?: number
  givens?: number
  calculatedDifficulty?: string
}

const creator = new SudokuCreator({ childMatrixSize: 3 })

const rate = (puzzle: Puzzle) => {
  const hardTechniques: (keyof Tally)[] = [
    'X-Wing',
    'Swordfish',
    'Jellyfish',
    'Hidden Quadruple',
    'Hidden Triple',
    'Naked Quadruple'
  ]
  const mediumTechniques: (keyof Tally)[] = [
    'Hidden Pair',
    'Locked Pair',
    'Naked Pair',
    'Naked Triple'
  ]
  let difficulty = 'Easy'
  if (any((technique) => puzzle.tally![technique]! > 0, hardTechniques)) difficulty = 'Hard'
  else if (puzzle.tally!['Hidden Pair']! > 2) difficulty = 'Hard'
  else if (any((technique) => puzzle.tally![technique]! > 0, mediumTechniques)) difficulty = 'Medium'

  return difficulty
}

const isNicePuzzle = (puzzle: Puzzle): boolean => {
  if (puzzle.solved == false) return false

  if (['Hard', 'Medium'].includes(puzzle.calculatedDifficulty!)) return true

  if (puzzle.givens! <= 20) return true

  return false
}

const savePuzzle = async (puzzle: Puzzle) => {
  logger.debug("Saving puzzle...")
  
  const client: mongoDb.MongoClient = new mongoDb.MongoClient(process.env.MONGODB_URL!)
          
  await client.connect()
      
  const db: mongoDb.Db = client.db('sudoku')
  const puzzlesCollection: mongoDb.Collection = db.collection('puzzles')
      
  logger.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${puzzlesCollection.collectionName}`
  )

  try {
    if (puzzle._id) {
      const result = await puzzlesCollection.replaceOne({ _id: puzzle._id }, puzzle)
      result
          ? logger.log(`Successfully updated puzzle with id ${puzzle._id} @ ${Date.now()}`)
          : logger.error('Failed to save puzzle')
    } else {
      const result = await puzzlesCollection.insertOne(puzzle)
      result
          ? logger.log(`Successfully saved new puzzle with id ${result.insertedId} @ ${Date.now()}`)
          : logger.error('Failed to save puzzle')
    }
  } catch (error) {
      logger.error(error)
  } finally {
    logger.log('Disconnecting from DB...')
    client.close()
  }
}

const getAllPuzzles = async () => {
  const client: mongoDb.MongoClient = new mongoDb.MongoClient(process.env.MONGODB_URL!)
          
  await client.connect()
      
  const db: mongoDb.Db = client.db('sudoku')
  const puzzlesCollection: mongoDb.Collection = db.collection('puzzles')
      
  logger.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${puzzlesCollection.collectionName}`
  )

  try {
    const result = await puzzlesCollection.find({})

    result
        ? logger.log(`Successfully found puzzles`)
        : logger.error('Failed to find puzzles')
    
    return result
    
  } catch (error) {
      logger.error(error)
  }
}

const createPuzzle = (): Puzzle => {
  const intendedDifficulty = (Math.random() * 0.4) + 0.6
  const board = creator.createSudoku(intendedDifficulty)

  const flattenedPuzzle = map(add(1), flatten(board.puzzle))
  const gridString = join('', flattenedPuzzle)
  const solutionString = join('', map(add(1), flatten(board.solution)))

  logger.debug(gridString)
  
  const givens = filter(gt(__, 0), flattenedPuzzle).length
  logger.debug(givens + ' givens')

  return { intendedDifficulty, gridString, solutionString, givens }
}

const getAndAnalysePuzzle = curry((getter: (() => Puzzle), _memo: Puzzle): Puzzle => {
  let puzzle = getter()
  
  let solution: Solution = { grid: parseGrid(puzzle.gridString!)!, techniques: [] }
  
  solution = solve(solution)
  
  const endString = serializeGrid(solution.grid!)
  
  logger.debug(endString)
  // logger.debug(solution.techniques)
  
  puzzle.solved = endString === puzzle.solutionString
  
  logger.debug(puzzle.solved ? 'solved' : 'not solved')

  puzzle.tally = countBy((i) => i as string, solution.techniques)
  logger.debug(puzzle.tally)

  // let puzzle: Puzzle = { gridString, solutionString, solved, tally, intendedDifficulty, givens }

  puzzle.calculatedDifficulty = rate(puzzle)
  logger.debug(puzzle.calculatedDifficulty)

  logger.debug(`Found ${count} puzzles`)

  return puzzle
})

const generateAndAnalyse = getAndAnalysePuzzle(createPuzzle)

const findPuzzle = async () => {
  logger.log("Searching for a new puzzle...")
  const nicePuzzle = until(isNicePuzzle, generateAndAnalyse, { solved: false, tally: {} })

  count++

  logger.log(nicePuzzle)
  
  await savePuzzle(nicePuzzle)
}

const minePuzzles = async () => {
  while (true) {
    await findPuzzle()
  }
}

const rateExistingPuzzles = async () => {
  const cursor = await getAllPuzzles()

  for await (const doc of cursor!) {
    const puzzle = doc as Puzzle
    puzzle.calculatedDifficulty = rate(puzzle)
    await savePuzzle(puzzle)
  }

  process.exit()
}

let count = 0

if (process.argv.includes('--rate')) {
  rateExistingPuzzles()
} else {
  minePuzzles()
}

const allTechniques = [
  'Full House',
  'Last Digit',
  'Naked Single',
  'Hidden Single',
  'Naked Pair',
  'Naked Triple',
  'Locked Pair',
  'Locked Candidates Type 1 (Pointing)',
  'Locked Candidates Type 2 (Claiming)',
  'Hidden Pair',
  'Hidden Triple',
  'Naked Quadruple',
  'Hidden Quadruple',
  'X-Wing',
  'Swordfish',
  'Jellyfish',
  'other'
]

// 000000030000010040901083500365200800000000000109800005008004300500370009000009600
// {
//   solved: true,
//   tally: {
//     'Hidden Single': 9,
//     'Locked Candidates Type 2 (Claiming)': 2,
//     'X-Wing': 1,
//     Swordfish: 2,
//     'Naked Triple': 1,
//     'Naked Single': 19,
//     'Last Digit': 7,
//     'Full House': 20
//   }
// }

// {
//   gridString: '700000315000460000950001000000000008003907100000120000004090600010704030030010007',
//   solutionString: '746289315321465789958371264192536478583947126467128593274893651619754832835612947',
//   solved: true,
//   tally: {
//     'Naked Single': 17,
//     'Full House': 21,
//     'Hidden Single': 10,
//     'Last Digit': 7,
//     'Naked Pair': 1,
//     'X-Wing': 1
//   }
// }