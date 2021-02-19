import { curry, __ } from "ramda"
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

const solve = (solution: Solution) => {

}

export default solve