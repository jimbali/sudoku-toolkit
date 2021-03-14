import { curry, reduce, reduced, __ } from "ramda"
import {
  eliminateBasicFish,
  eliminateHiddenSubset,
  eliminateLockedCandidates,
  eliminateNakedSubset,
  solveFullHouse,
  solveHiddenSingle,
  solveLastDigit,
  solveNakedSingle,
  SubsetType,
  SudokuGrid
} from "sudoku-master"
import { EliminationResult } from "sudoku-master/lib/solver/logical/eliminating/types"
import { SolvingResult } from "sudoku-master/lib/solver/logical/solving/types"

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

const solve = (solution: Solution) => {

}

export { eliminationTechniques, nextOperation, solvingTechniques }

export default solve