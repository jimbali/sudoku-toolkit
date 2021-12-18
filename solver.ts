import { append, cond, curry, equals, filter, find, findIndex, has, intersection, isEmpty, map, not, nth, pipe, prop, propEq, reduce, reduced, reject, sortBy, uniq, __ } from "ramda"
import {
  CellCoord,
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
import { EliminationCandidate, EliminationResult } from "sudoku-master/lib/solver/logical/eliminating/types"
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
  return cond([
    [has('coord'), enterDigit(grid)],
    [has('eliminations'), eliminateDigits(grid)]
  ])(operation)
}

const sortByFirstItem = sortBy(prop<string>('0'))

const enterDigit = curry((grid: SudokuGrid, solvingResult: SolvingResult): SudokuGrid => {
  let digits: [GridIndex, Digit][] = Array.from(grid.digits)
  const index: GridIndex = getCellIndexInGrid([solvingResult.coord[0], solvingResult.coord[1]])
  digits = append([index, solvingResult.digit], digits)
  digits = sortByFirstItem(digits)
  return { ...grid, digits: new Map(digits) }
})

const eliminateDigits = curry((grid: SudokuGrid, eliminationResult: EliminationResult): SudokuGrid => {
  const allCandidates: [GridIndex, Pencilmarks][] = Array.from(grid.candidates)

  const newCandidates = reduce((candidatesMemo2: [GridIndex, Pencilmarks][], elimination: EliminationCandidate) => {
    return reduce((candidatesMemo: [GridIndex, Pencilmarks][], coord: CellCoord) => {
      const gridIndex: GridIndex = getCellIndexInGrid([coord[0], coord[1]])
      const listIndex = findIndex(propEq(0, gridIndex), candidatesMemo)!
      let candidateEntry = candidatesMemo[listIndex]
      candidateEntry[1] = reject(equals(elimination.digit), candidateEntry[1])
      candidatesMemo[listIndex] = candidateEntry
      return candidatesMemo
    }, candidatesMemo2, elimination.coords)
  }, allCandidates, eliminationResult.eliminations)

  return { ...grid, candidates: new Map(newCandidates) }
})

function intersectPairs(list1: [GridIndex, Pencilmarks][], list2: [GridIndex, Pencilmarks][]) {
  let keys = uniq(intersection(map(nth(0), list1), map(nth(0), list2)))
  // keys = sort(comparator(lt), keys)
  return map(gridIndex => [
    gridIndex,
    intersection(
      find(propEq(0, gridIndex), list1)![1],
      find(propEq(0, gridIndex), list2)![1]
    )
  ], keys)
}

const eliminateInvalidCandidates = (grid: SudokuGrid): SudokuGrid => {
  const knownCandidates = Array.from(grid.candidates.entries())
  grid = parseGrid(serializeGrid(grid, { pencilmarks: true })!)!
  const calculatedCandidates = Array.from(getCandidates(grid.digits).entries())
  let deepIntersection = intersectPairs(knownCandidates, calculatedCandidates) as [GridIndex, Pencilmarks][]
  deepIntersection = filter(pipe(nth(1), isEmpty, not), deepIntersection)
  const newCandidates = (new Map(deepIntersection))
  return { ...grid, candidates: newCandidates }
}


const solve = (solution: Solution) => {
}

export { applyOperation, eliminateInvalidCandidates, eliminationTechniques, enterDigit, nextOperation, solvingTechniques }

export default solve