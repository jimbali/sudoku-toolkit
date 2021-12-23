import { append, concat, cond, curry, equals, filter, find, findIndex, has, intersection, isEmpty, map, not, nth, pipe, prop, propEq, reduce, reduced, reject, sortBy, uniq, until, __ } from "ramda"
import {
  CellCoord,
  Digit,
  eliminateBasicFish,
  eliminateHiddenSubset,
  eliminateLockedCandidates,
  eliminateNakedSubset,
  getCandidates,
  GridIndex,
  Pencilmarks,
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
  techniques: (EliminationResult | SolvingResult | string)[]
}

const eliminateNakedSubsetCurried = curry(eliminateNakedSubset)
const eliminateHiddenSubsetCurried = curry(eliminateHiddenSubset)
const eliminateBasicFishCurried = curry(eliminateBasicFish)

type Technique =
  ((grid: SudokuGrid, skip?: number | undefined, count?: number | undefined) => readonly SolvingResult[]) |
  ((grid: SudokuGrid) => readonly EliminationResult[])

const solvingTechniques: Technique[] = [
  solveFullHouse,
  solveLastDigit,
  solveNakedSingle,
  solveHiddenSingle
]

const eliminationTechniques: Technique[] = [
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

const allTechniques: Technique[] = [...solvingTechniques, ...eliminationTechniques]

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
  const gridIndex: GridIndex = getCellIndexInGrid([solvingResult.coord[0], solvingResult.coord[1]])
  digits = append([gridIndex, solvingResult.digit], digits)
  digits = sortByFirstItem(digits)
  // Remove from candidates too
  const newGrid = eliminateDigits(
    grid,
    { eliminations: [{ digit: solvingResult.digit, coords: [solvingResult.coord]}] }
  )
  return { ...newGrid, digits: new Map(digits) }
})

const eliminateDigits = curry((grid: SudokuGrid, eliminationResult: { eliminations: readonly EliminationCandidate[] }): SudokuGrid => {
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
  const calculatedCandidates = Array.from(getCandidates(grid.digits).entries())
  let deepIntersection = intersectPairs(knownCandidates, calculatedCandidates) as [GridIndex, Pencilmarks][]
  deepIntersection = filter(pipe(nth(1), isEmpty, not), deepIntersection)
  const newCandidates = (new Map(deepIntersection))
  return { ...grid, candidates: newCandidates }
}

type SolutionPair = {
  current: Solution,
  last?: Solution
}

const applyNext = curry((ops: Technique[], solutions: SolutionPair): SolutionPair => {
  const op = nextOperation(ops)(solutions.current.grid)
  if (!op) return { ...solutions, last: solutions.current }

  const result = op[0] // TODO: each?
  const newGrid = applyOperation(solutions.current.grid, result)

  return {
    current: { grid: eliminateInvalidCandidates(newGrid), techniques: concat(solutions.current.techniques, [result.technique]) },
    last: solutions.current
  }
})

const finished = (solutionPair: SolutionPair) =>
  equals(solutionPair.current.grid, solutionPair.last?.grid)

const solve = (solution: Solution): Solution => {
  const solved: SolutionPair = until(finished, applyNext(allTechniques), { current: solution })
  return solved.current
}

export { applyOperation, eliminateInvalidCandidates, eliminationTechniques, enterDigit, nextOperation, solvingTechniques }

export default solve