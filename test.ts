import { CellCoord, Digit, eliminateBasicFish, eliminateHiddenSubset, eliminateLockedCandidates, eliminateNakedSubset, getCandidates, GridIndex, houseIdentifier, isValidGrid, parseGrid, serializeGrid, solveFullHouse, solveHiddenSingle, solveLastDigit, solveNakedSingle, SubsetType, SudokuGrid } from 'sudoku-master'
import { getCandidatesIndexes, getCellsContainingCandidate } from 'sudoku-master/lib/utils/candidate'
import { getHouseValues, HOUSES_LIST } from 'sudoku-master/lib/utils/house'
import { find, map } from 'remeda'
import { any, concat, curry, equals, forEach, not, prop, propEq, reduce, reduced, reject, until, zip, zipObj, __ } from 'ramda'
import { SolvingResult } from 'sudoku-master/lib/solver/logical/solving/types'
import { getCellIndexInGrid } from 'sudoku-master/lib/utils/cell'
import { EliminationCandidate, EliminationResult } from 'sudoku-master/lib/solver/logical/eliminating/types'

// '.234..8..6....7......53.62...5......84.....36......1...52.96......1....7..8..521.'

// const initial = [
//   3, null, 9, null, null, null, 4, null, null,
//   2, null, null, 7, null, 9, null, null, null,
//   null, 8, 7, null, null, null, null, null, null,
//   7, 5, null, null, 6, null, 2, 3, null,
//   6, null, null, 9, null, 4, null, null, 8,
//   null, 2, 8, null, 5, null, null, 4, 1,
//   null, null, null, null, null, null, 5, 9, null,
//   null, null, null, 1, null, 6, null, null, 7,
//   null, null, 6, null, null, null, 1, null, 4
// ]

// const initial = [
//   2, 4, 9, null, 6, 5, 1, null, 3,
//   null, 3, null, null, null, null, 2, null, null,
//   8, 6, null, null, null, null, null, null, 5,
//   null, 2, null, null, null, 6, null, null, null,
//   null, 8, null, 2, null, null, null, null, null,
//   null, 1, null, null, 4, null, 8, 2, null,
//   null, 9, null, 5, null, null, 7, null, null,
//   null, 5, 4, null, null, null, null, null, 1,
//   null, 7, null, null, null, 3, null, null, null
// ]

// const gridString = initial.map((v) => (v || '.')).join('')

// const gridString = '720096003000205000080004020000000060106503807040000000030800090000702000200430018'

// const gridArray = gridString.split('').map(char => char === '0' ? null : Number(char))

// console.log(gridString)
// console.log(gridArray)

// let grid = parseGrid(gridString)
// console.log(grid)

// const candidates = getCandidates(grid!.digits)
// console.log(candidates)

// const pencilMarks: number[][] = Array(9 * 9).fill([])
// candidates.forEach((v, k) => {
//   pencilMarks[k] = v.map((num) => num)
// })

// console.log(pencilMarks)

// const candidateIndexes = getCandidatesIndexes(candidates)
// console.log(candidateIndexes)

// const cellsContainingCandidate = getCellsContainingCandidate(candidates, undefined)(8)
// console.log(cellsContainingCandidate)

// if (grid) console.log(isValidGrid(grid))

// console.log(HOUSES_LIST)

// console.log(solveNakedSingle(grid!))
// console.log(solveFullHouse(grid!))

/*
const techniques2 = [
  solveFullHouse, solveLastDigit, solveNakedSingle, solveHiddenSingle
]

// console.log(find((technique: any) => technique(grid!) ))

const logicalHint2 = (fns: ((grid: SudokuGrid) => any)[], value: SudokuGrid) => (
  reduce((acc, nextFn) => {
    const nextVal = nextFn(value)
    return nextVal.length > 0 ? reduced(nextVal) : acc
  }, null, fns)
)

let hints = logicalHint2(techniques2, grid!) as any
const techniquesUsed = []
  
console.log(gridArray)

while(hints) {
  const hint = hints[0]
  techniquesUsed.push(hint.technique)

  const index = getCellIndexInGrid([hint.coord[0], hint.coord[1]])
  gridArray[index] = hint.digit
  
  grid = parseGrid(gridArray.map((v) => (v || '.')).join(''))
  
  console.log(gridArray)

  hints = logicalHint2(techniques2, grid!) as any
}

console.log(gridArray.map((v) => (v || '.')).join(''))
console.log(techniquesUsed)

grid = parseGrid(gridArray.map((v) => (v || '.')).join(''))

if(grid) console.log(eliminateNakedSubset(grid, SubsetType.Triple))

*/

// console.log(eliminateLockedCandidates(grid!))

// const subsets = [eliminateNakedSubset, eliminateHiddenSubset, eliminateBasicFish]

// const eliminateSubsets = (fns: ((grid: SudokuGrid, level: SubsetType) => any)[], value: SudokuGrid) => (
//   reduce((acc, nextFn) => {
//     const nextVal = nextFn(value, SubsetType.Triple)
//     return nextVal.length > 0 ? reduced(nextVal) : acc
//   }, null, fns)
// )

// console.log(eliminateSubsets(subsets, grid!))

// console.log(grid)

// grid = parseGrid(':0200:3:7..+8+49.3.+9+2+81+35..64..26+7.+89+6+42+783951+3+97+4+5.6+2+8+8+156+9+2+3..+2.+4+5+1+6.+931....+8.6.+5....4.1.::382: ')
const args = process.argv.slice(2)

// '720096003000205000080004020000000060106503807040000000030800090000702000200430018'
let grid = parseGrid(args[0])

grid = { ...grid!, candidates: getCandidates(grid!.digits) }
console.log(serializeGrid(grid))

// grid = parseGrid(`
// +------------------+--------------+-----------------+
// | 7     2   45     | 1   9   6    | 45    8   3     |
// | 3469  16  1349   | 2   8   5    | 1469  7   1469  |
// | 569   8   159    | 3   7   4    | 1569  2   1569  |
// +------------------+--------------+-----------------+
// | 358   57  23578  | 9   4   78   | 1235  6   125   |
// | 1     9   6      | 5   2   3    | 8     4   7     |
// | 358   4   23578  | 6   1   78   | 2359  35  259   |
// +------------------+--------------+-----------------+
// | 456   3   457    | 8   56  1    | 24567 9   2456  |
// | 45689 156 14589  | 7   56  2    | 3456  35  456   |
// | 2     567 57     | 4   3   9    | 567   1   8     |
// +------------------+--------------+-----------------+
// `)

// console.log(grid)
// console.log(eliminateNakedSubset(grid!, SubsetType.Triple))

type Solution = {
  candidates?: ReadonlyMap<GridIndex, readonly Digit[]>
  grid: SudokuGrid
  techniques: string[]
}

const eliminateNakedSubsetCurried = curry(eliminateNakedSubset)
const eliminateHiddenSubsetCurried = curry(eliminateHiddenSubset)
const eliminateBasicFishCurried = curry(eliminateBasicFish)

const solvingTechniques = [
  solveFullHouse,
  solveLastDigit,
  solveNakedSingle,
  solveHiddenSingle
]

const eliminationTechniques = [
  eliminateNakedSubsetCurried(__, SubsetType.Pair),
  eliminateNakedSubsetCurried(__, SubsetType.Triple),
  eliminateHiddenSubsetCurried(__, SubsetType.Pair),
  eliminateHiddenSubsetCurried(__, SubsetType.Triple),
  eliminateNakedSubsetCurried(__, SubsetType.Quadruple),
  eliminateHiddenSubsetCurried(__, SubsetType.Quadruple),
  eliminateBasicFishCurried(__, SubsetType.Pair),
  eliminateBasicFishCurried(__, SubsetType.Triple),
  eliminateBasicFishCurried(__, SubsetType.Quadruple)
]

const applyNextFunction = curry(
  (fns: ((grid: SudokuGrid) => any)[], value: SudokuGrid): any[] | null => (
    reduce((acc, nextFn) => {
      const nextVal = nextFn(value)
      return nextVal.length > 0 ? reduced(nextVal) : acc
    }, null, fns)
  )
)

const nextSolve = applyNextFunction(solvingTechniques)
const nextElimination = applyNextFunction(eliminationTechniques)

const inputSolution = (gridArr: (number | null)[], solve: SolvingResult): (number | null)[] => {
  const index = getCellIndexInGrid([solve.coord[0], solve.coord[1]])
  gridArr[index] = solve.digit
  return gridArr
}

const eliminateDigitFromCell = curry((digit: number, gridArr: string[], coord: CellCoord): string[] => {
  const index = getCellIndexInGrid([coord[0], coord[1]])
  console.log(gridArr.join(' '))
  const existingCellCandidates = gridArr[index].split('').map((v) => Number(v))
  if (!existingCellCandidates) console.log("No candidate at " + index)
  const newCellCandidates = reject(equals(digit), existingCellCandidates!)

  gridArr[index] = newCellCandidates.join('')

  return gridArr
})

const eliminateDigitFromCells = (gridArr: string[], elimination: EliminationCandidate) => {
  console.log(JSON.stringify(elimination))
  const eliminateThisDigit = eliminateDigitFromCell(Number(elimination.digit))
  return reduce(eliminateThisDigit, gridArr, elimination.coords)
}

const eliminateAll = (grid: SudokuGrid, elimination: EliminationResult): SudokuGrid => {
  console.log(elimination.technique)
  let gridArr = serializeGrid(grid, { pencilmarks: true })!.split(' ')
  gridArr = reduce(eliminateDigitFromCells, gridArr, elimination.eliminations)
  return parseGrid(gridArr.join(' '))!
}

const solveNext = (params: Solution): Solution => {
  const { grid, techniques } = params
  const solves = nextSolve(grid)
  console.log(JSON.stringify(solves))
  let gridArr = serializeGrid(grid)!.split('').map((v) => v === '.' ? null : Number(v))
  if (!solves) {
    return params
  } else {
    gridArr = reduce(inputSolution, gridArr, solves)
    return {
      grid: parseGrid(gridArr.map((v) => v === null ? '.' : String(v)).join(''))!,
      techniques: concat(techniques, [solves[0].technique]) // TODO: Is there ever more than one solve?
    }
  }
}

const eliminateNext = (params: Solution): Solution => {
  let { grid, techniques } = params
  const eliminations = nextElimination(grid)
  console.log(JSON.stringify(eliminations))
  if(!eliminations) {
    return params
  } else {
    return {
      grid: eliminateAll(grid, eliminations[0]),
      techniques: concat(techniques, map(eliminations, (value) => value.technique))
    }
  }
}

const transformUntilNoChange = (params: Solution, fn: (params: Solution) => Solution): Solution => {
  let { grid, techniques } = params
  let oldGrid = grid
  let result = fn(params)
  let newGrid = result.grid
  techniques = result.techniques
  let candidates = result.candidates
  while (not(equals(newGrid, oldGrid))) {
    console.log(serializeGrid(newGrid))
    oldGrid = newGrid
    result = fn({ candidates, grid: oldGrid, techniques })
    newGrid = result.grid
    techniques = result.techniques
    candidates = result.candidates
  }
  return { candidates, grid: newGrid, techniques }
}

const solveOrEliminate = (params: Solution): Solution => {
  let { candidates, grid, techniques } = params
  let result = transformUntilNoChange(params, solveNext)
  grid = result.grid
  techniques = result.techniques
  if (!candidates) candidates = getCandidates(grid.digits)
  grid = { ...grid, candidates }
  let serialized = serializeGrid(grid, { pencilmarks: true })
  grid = parseGrid(serialized!)!
  result = eliminateNext({ grid, techniques })
  grid = result.grid
  techniques = result.techniques
  serialized = serializeGrid(grid, { pencilmarks: true })
  grid = parseGrid(serialized!)!
  candidates = grid.candidates
  return { candidates, grid, techniques }
}

const result = transformUntilNoChange({ grid, techniques: [] }, solveOrEliminate)
console.log(result.techniques)

const allTechniques = [
  'Full House',
  'Last Digit',
  'Naked Single',
  'Hidden Single',
  'Naked Pair',
  'Naked Triple',
  'Hidden Pair',
  'Hidden Triple',
  'Naked Quadruple',
  'Hidden Quadruple',
  'Locked Pair',
  'X-Wing',
  'Swordfish',
  'Jellyfish',
  'other'
]

const tally = new Map<string, number>(zip(allTechniques, (new Array(allTechniques.length)).fill(0)))

console.log(
  reduce(
    (tally: Map<string, number>, technique) => {
      if (tally.has(technique)) {
        let count = tally.get(technique) || 0
        tally.set(technique, ++count)
      } else {
        let other = tally.get('other') || 0
        tally.set('other', ++other)
      }
      return tally
    },
    tally,
    result.techniques
  )
)

// let leGrid = parseGrid('72.196.83...285.7..8.374.2....94..6.196523847.4.61.....3.8.1.9....7.2...2..439.18')!
// leGrid = { ...grid, candidates: getCandidates(leGrid.digits) }
// console.log(eliminateNakedSubset(leGrid, SubsetType.Triple))



// grid = { ...grid, candidates: getCandidates(grid!.digits) }
// console.log(JSON.stringify(nextElimination(grid)))

// const eliminateNext = (grid: SudokuGrid | null): SudokuGrid | null => {
//   const solves = nextElimination(grid)
//   return solves && reduce(eliminate, grid, solves)
// }



/*
until no difference:
  until no difference: applyNextSolve -> newGrid, techniquesApplied
  until no difference: applyNextElimination -> newGrid, techniquesApplied
end

*/
