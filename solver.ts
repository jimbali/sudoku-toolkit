import { append, curry, filter, intersection, map, prop, propEq, reduce, reduced, sortBy, zip, __ } from "ramda"
import {
  Digit,
  eliminateBasicFish,
  eliminateHiddenSubset,
  eliminateLockedCandidates,
  eliminateNakedSubset,
  getCandidates,
  GridIndex,
  parseGrid,
  Pencilmarks,
  serializeGrid,
  solveFullHouse,
  solveHiddenSingle,
  solveLastDigit,
  solveNakedSingle,
  SubsetType,
  SudokuGrid
} from "sudoku-master"
import { EliminationResult } from "sudoku-master/lib/solver/logical/eliminating/types"
import { SolvingResult } from "sudoku-master/lib/solver/logical/solving/types"
import { getCellIndexInGrid } from "sudoku-master/lib/utils/cell"

type Solution = {
  grid: SudokuGrid
  techniques: (EliminationResult | SolvingResult)[]
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
  eliminateLockedCandidates,
  eliminateHiddenSubsetCurried(__, SubsetType.Pair),
  eliminateHiddenSubsetCurried(__, SubsetType.Triple),
  eliminateNakedSubsetCurried(__, SubsetType.Quadruple),
  eliminateHiddenSubsetCurried(__, SubsetType.Quadruple),
  eliminateBasicFishCurried(__, SubsetType.Pair),
  eliminateBasicFishCurried(__, SubsetType.Triple),
  eliminateBasicFishCurried(__, SubsetType.Quadruple)
]

const nextOperation = curry(
  (fns: ((grid: SudokuGrid) => any)[], value: SudokuGrid): any[] | null => (
    reduce((acc, nextFn) => {
      const nextVal = nextFn(value)
      return nextVal.length > 0 ? reduced(nextVal) : acc
    }, null, fns)
  )
)

const applyOperation = (grid: SudokuGrid, operation: SolvingResult | EliminationResult) => {
  // return cond(
  //   [has('coord'), enterDigit(grid)]
  // )(operation)
}
const sortByFirstItem = sortBy(prop<string>('0'))

const enterDigit = curry((grid: SudokuGrid, solvingResult: SolvingResult): SudokuGrid => {
  let digits: [GridIndex, Digit][] = Array.from(grid.digits)
  const index: GridIndex = getCellIndexInGrid([solvingResult.coord[0], solvingResult.coord[1]])
  digits = append([index, solvingResult.digit], digits)
  digits = sortByFirstItem(digits)
  return { ...grid, digits: new Map(digits) }
})

const eliminateInvalidCandidates = (grid: SudokuGrid): SudokuGrid => {
  const knownCandidates = Array.from(grid.candidates.entries())
  console.log(knownCandidates)
  grid = parseGrid(serializeGrid(grid)!)!
  const calculatedCandidates = Array.from(getCandidates(grid.digits).entries())
  console.log(calculatedCandidates)
  const zipped = zip(knownCandidates, calculatedCandidates)
  let deepIntersection: [GridIndex, Pencilmarks][] = Array.from(map((items) => [items[0][0], intersection(items[0][1], items[1][1])], zipped))
  console.log(deepIntersection)
  deepIntersection = filter(propEq('length', 2), deepIntersection)
  console.log(deepIntersection)
  const newCandidates = (new Map(deepIntersection))
  return { ...grid, candidates: newCandidates }
}


const solve = (solution: Solution) => {
}

export { applyOperation, eliminateInvalidCandidates, eliminationTechniques, enterDigit, nextOperation, solvingTechniques }

export default solve