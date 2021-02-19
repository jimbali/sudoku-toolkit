import { parseGrid } from 'sudoku-master'
import solve from './solver'

describe('solve', () => {
  it('solves a naked triple', () => {
    const grid = parseGrid('720196083000285070080374020000940060196523847040610000030801090000702000200439018')!

    const solved = solve({ grid, techniques: [] })

    expect(solved).toEqual({ grid, techniques: [] })
  })
})