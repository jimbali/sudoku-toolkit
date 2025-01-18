#!/usr/bin/env node
import { SudokuCreator } from '@algorithm.ts/sudoku'
import { add, any, countBy, curry, filter, flatten, gt, join, map, until, __ } from 'ramda'
import { parseGrid, serializeGrid } from 'sudoku-master'
import { Solution, solve } from '@jimbali/sudoku-solver'
import Logger from './logger'
import * as dotenv from 'dotenv'
import { PuzzleSchema, TallySchema } from '@jimbali/sudoku-api-contract'
import { z } from 'zod'
import { EliminationTechnique } from 'sudoku-master/lib/solver/logical/eliminating/types'
import { SolvingTechnique } from 'sudoku-master/lib/solver/logical/solving/types'
import { inRange, invert, mapValues } from 'lodash'
import { initClient } from '@ts-rest/core'
import { apiContract } from '@jimbali/sudoku-api-contract'
import { clientCredentialsGrant, discovery } from 'openid-client'
dotenv.config()

const logger = new Logger(process.env.LOG_LEVEL ?? 'info')

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
  id?: string
  gridString?: string
  solutionString?: string
  solved?: boolean
  tally?: Tally
  intendedDifficulty?: number
  givens?: number
  calculatedDifficulty?: string
}

type PuzzleDto = z.infer<typeof PuzzleSchema>
type TallyDto = z.infer<typeof TallySchema>

const techniqueNames: Record<keyof TallyDto, EliminationTechnique | SolvingTechnique | 'other'> = {
  fullHouse: 'Full House',
  lastDigit: 'Last Digit',
  nakedSingle: 'Naked Single',
  hiddenSingle: 'Hidden Single',
  nakedPair: 'Naked Pair',
  nakedTriple: 'Naked Triple',
  lockedPair: 'Locked Pair',
  lockedCandidatesType1: 'Locked Candidates Type 1 (Pointing)',
  lockedCandidatesType2: 'Locked Candidates Type 2 (Claiming)',
  hiddenPair: 'Hidden Pair',
  hiddenTriple: 'Hidden Triple',
  nakedQuadruple: 'Naked Quadruple',
  hiddenQuadruple: 'Hidden Quadruple',
  xWing: 'X-Wing',
  swordfish: 'Swordfish',
  jellyfish: 'Jellyfish',
  other: 'other'
}
const techniqueKeys = invert(techniqueNames) as Record<EliminationTechnique | SolvingTechnique | 'other', keyof TallyDto>

const toTallyDto = (tally: Tally): TallyDto =>
  mapValues(techniqueNames, (_value: unknown, key: keyof typeof techniqueNames) =>
    tally[techniqueNames[key] as keyof Tally] ?? 0
  )

const fromTallyDto = (tally: TallyDto): Tally =>
  mapValues(techniqueKeys, (_value: unknown, key: keyof typeof techniqueKeys) =>
    tally[techniqueKeys[key] as keyof TallyDto]
  )

const toPuzzleDto = (puzzle: Puzzle): PuzzleDto => ({
  ...puzzle,
  solved: puzzle.solved ?? false,
  tally: toTallyDto(puzzle.tally!),
})

const fromPuzzleDto = (puzzle: PuzzleDto): Puzzle => ({
  ...puzzle,
  id: puzzle.id ?? undefined,
  gridString: puzzle.gridString ?? undefined,
  solutionString: puzzle.solutionString ?? undefined,
  intendedDifficulty: puzzle.intendedDifficulty ?? undefined,
  givens: puzzle.givens ?? undefined,
  calculatedDifficulty: puzzle.calculatedDifficulty ?? undefined,
  tally: fromTallyDto(puzzle.tally!),
})

const creator = new SudokuCreator({ childMatrixSize: 3 })

let token: string

const apiClient = initClient(apiContract, {
  baseUrl: process.env.SUDOKU_API_URL!,
  baseHeaders: {
    'x-app-source': 'ts-rest',
    'Authorization': () => `Bearer ${token}`,
  },
})

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

  const desiredDifficulties = process.env.DESIRED_DIFFICULTIES!.split(',')

  if (desiredDifficulties.includes(puzzle.calculatedDifficulty!)) return true

  if (puzzle.givens! <= 20) return true

  return false
}

const savePuzzle = async (puzzle: Puzzle) => {
  logger.debug('Saving puzzle...')

  logger.debug(puzzle)

  try {
    let response: { status: number }
    if (puzzle.id) {
      response = await apiClient.updatePuzzle({ params: { id: puzzle.id }, body: toPuzzleDto(puzzle) })
    } else {
      response = await apiClient.createPuzzle({ body: toPuzzleDto(puzzle) })
    }
    if ([200, 201].includes(response.status)) {
      logger.debug('Puzzle saved')
    } else {
      logger.error('Failed to save puzzle - status: ' + response.status)
    }
  } catch (error) {
    logger.error(error)
  }
}

const getPuzzleBatch = async (batchSize: number, offset: number): Promise<Puzzle[]> => {
  const response = await apiClient.getPuzzles({ query: { take: String(batchSize), skip: String(offset) } })
  const puzzles = response.body as PuzzleDto[]
  return puzzles.map((puzzle) => fromPuzzleDto(puzzle))
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
  
  puzzle.solved = endString === puzzle.solutionString
  
  logger.debug(puzzle.solved ? 'solved' : 'not solved')

  puzzle.tally = countBy((i) => i as string, solution.techniques)
  logger.debug(puzzle.tally)

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

const obtainAccessToken = async () => {
  const config = await discovery(
    new URL(process.env.AUTH_SERVER_URL!),
    process.env.AUTH_CLIENT_ID!,
    process.env.AUTH_CLIENT_SECRET!,
  )
  const response = await clientCredentialsGrant(config)
  token = response.access_token
}

const minePuzzles = async () => {
  await obtainAccessToken()

  while (true) {
    await findPuzzle()
  }
}

const rateExistingPuzzles = async () => {
  await obtainAccessToken()

  const batchSize = Number(process.env.BATCH_SIZE ?? 100)
  let page = 0
  let count = 0

  let puzzleBatch = await getPuzzleBatch(batchSize, 0)

  while (puzzleBatch.length > 0) {
    for (const puzzle of puzzleBatch) {
      puzzle.calculatedDifficulty = rate(puzzle)
      await savePuzzle(puzzle)
      count++
    }

    page++
    puzzleBatch = await getPuzzleBatch(batchSize, page * batchSize)
  }

  logger.log(`Rated ${count} puzzles`)

  process.exit()
}

let count = 0

if (process.argv.includes('--rate')) {
  rateExistingPuzzles()
} else {
  minePuzzles()
}
