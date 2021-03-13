import { parseGrid } from 'sudoku-master'
import solve, { applyNext, solvingTechniques } from './solver'

// describe('solve', () => {
//   it('solves a naked triple', () => {
//     const grid = parseGrid('720196083000285070080374020000940060196523847040610000030801090000702000200439018')!

//     const solved = solve({ grid, techniques: [] })

//     expect(solved).toEqual({ grid, techniques: [] })
//   })
// })

describe('nextOperation', () => {
  it('identifies a full house', () => {
    const grid = parseGrid('672105398145000672089002451063574819958000743014090526007200084026000035001409067')!

    const applied = applyNext(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [0, 4], digit: 4, technique: 'Full House'} ])
  })

  it('identifies a last digit', () => {
    const grid = parseGrid('700104028406070015108030674000301000387000149000709000852017403900000507670400001')!

    const applied = applyNext(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [3, 6], digit: 7, technique: 'Last Digit'} ])
  })

  it('identifies a naked single', () => {
    const grid = parseGrid('700104028406070015108030674000301700387000149000709000852017403900000507670400001')!

    const applied = applyNext(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [8, 2], digit: 3, technique: 'Naked Single'} ])
  })
})
