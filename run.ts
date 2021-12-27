import { SudokuCreator } from '@algorithm.ts/sudoku'
import { add, clone, countBy, filter, flatten, gt, join, map, prop, reduce, until, zip, __ } from 'ramda'
import { parseGrid, serializeGrid } from 'sudoku-master'
import solve, { Solution } from './solver'

const creator = new SudokuCreator({ childMatrixSize: 3 })

const isNicePuzzle = (memo: { solved: boolean, tally: any }) =>
  memo.solved == true && memo.tally['X-Wing'] > 0

const generateAndAnalyse = (memo: { solved: boolean, tally: string[] }) => {

  const puzzle = creator.createSudoku(0.8)

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
  console.log(solution.techniques)
  
  const solved = endString === solutionString
  
  console.log(solved ? 'solved' : 'not solved')

  const tally = countBy((i) => i as string, solution.techniques)
  
  console.log(tally)

  return { solved, tally }
}

const nicePuzzle = until(isNicePuzzle, generateAndAnalyse, { solved: false, tally: {} })

console.log(nicePuzzle)

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