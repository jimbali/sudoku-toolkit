import { SudokuCreator } from '@algorithm.ts/sudoku'
import { add, clone, countBy, filter, flatten, gt, join, map, prop, reduce, until, zip, __ } from 'ramda'
import { parseGrid, serializeGrid } from 'sudoku-master'
import solve, { Solution } from './solver'
import { ObjectId } from 'mongodb'
import { collections, connectToDatabase } from './database.service'

type Puzzle = {
  id?: ObjectId
  gridString?: string
  solutionString?: string
  solved: boolean
  tally: {
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
  intendedDifficulty?: number
  givens?: number
}

const creator = new SudokuCreator({ childMatrixSize: 3 })

const isNicePuzzle = (memo: Puzzle): boolean => {
  if (memo.solved == false) return false

  if (memo.tally['X-Wing']! > 0) return true

  if (memo.tally['Swordfish']! > 0) return true

  if (memo.tally['Jellyfish']! > 0) return true

  if (memo.tally['Hidden Quadruple']! > 0) return true

  if (memo.tally['Hidden Triple']! > 0) return true

  if (memo.tally['Hidden Pair']! > 2) return true

  if (memo.givens! <= 20) return true

  return false
}

const savePuzzle = async (puzzle: Puzzle) => {
  try {
    const result = await collections.puzzles?.insertOne(puzzle)

    result
        ? console.log(`Successfully saved puzzle with id ${result.insertedId}`)
        : console.log('Failed to save puzzle');
  } catch (error) {
      console.error(error)
  }
}

const generateAndAnalyse = (memo: Puzzle): Puzzle => {
  const intendedDifficulty = (Math.random() * 0.4) + 0.6
  const puzzle = creator.createSudoku(intendedDifficulty)

  const flattenedPuzzle = map(add(1), flatten(puzzle.puzzle))
  const gridString = join('', flattenedPuzzle)
  const solutionString = join('', map(add(1), flatten(puzzle.solution)))

  console.log(gridString)
  
  const givens = filter(gt(__, 0), flattenedPuzzle).length
  console.log(givens + ' givens')
  
  let solution: Solution = { grid: parseGrid(gridString)!, techniques: [] }
  
  solution = solve(solution)
  
  const endString = serializeGrid(solution.grid!)
  
  console.log(serializeGrid(solution.grid!))
  // console.log(solution.techniques)
  
  const solved = endString === solutionString
  
  console.log(solved ? 'solved' : 'not solved')

  const tally = countBy((i) => i as string, solution.techniques)
  
  console.log(tally)

  return { gridString, solutionString, solved, tally, intendedDifficulty, givens }
}

connectToDatabase()
  .then(() => {
    const nicePuzzle = until(isNicePuzzle, generateAndAnalyse, { solved: false, tally: {} })

    console.log(nicePuzzle)
    
    savePuzzle(nicePuzzle)
  })
  .catch((error: Error) => {
      console.error('Database connection failed', error)
  })

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