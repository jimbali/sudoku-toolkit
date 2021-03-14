import { getCandidates, parseGrid, SudokuGrid } from 'sudoku-master'
import solve, { eliminationTechniques, nextOperation, solvingTechniques } from './solver'

// describe('solve', () => {
//   it('solves a naked triple', () => {
//     const grid = parseGrid('720196083000285070080374020000940060196523847040610000030801090000702000200439018')!

//     const solved = solve({ grid, techniques: [] })

//     expect(solved).toEqual({ grid, techniques: [] })
//   })
// })

const prepareGrid = (gridString: string): SudokuGrid => {
  const grid = parseGrid(gridString)
  return { ...grid!, candidates: getCandidates(grid!.digits) }
}

describe('nextOperation', () => {
  it('identifies a full house', () => {
    const grid = prepareGrid('672105398145000672089002451063574819958000743014090526007200084026000035001409067')!

    const applied = nextOperation(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [0, 4], digit: 4, technique: 'Full House'} ])
  })

  it('identifies a last digit', () => {
    const grid = prepareGrid('700104028406070015108030674000301000387000149000709000852017403900000507670400001')!

    const applied = nextOperation(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [3, 6], digit: 7, technique: 'Last Digit'} ])
  })

  it('identifies a naked single', () => {
    const grid = prepareGrid('700104028406070015108030674000301700387000149000709000852017403900000507670400001')!

    const applied = nextOperation(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [8, 2], digit: 3, technique: 'Naked Single'} ])
  })

  it('identifies a hidden single', () => {
    const grid = prepareGrid('700104028406070015108030674000301700387000149000709000852017403900000507673400001')!

    const applied = nextOperation(solvingTechniques, grid)

    expect(applied).toEqual([{ coord: [0, 4], digit: 6, technique: 'Hidden Single'} ])
  })

  // it('identifies a naked pair', () => {
  //   const grid = prepareGrid('720196083000285070080374020000940060196523847040610000030801090000702000200439018')!

  //   const applied = nextOperation(eliminationTechniques, grid)

  //   expect(applied).toEqual([{ coord: [0, 4], digit: 6, technique: 'Naked Triple'} ])
  // })

  it('identifies a naked triple', () => {
    const grid = prepareGrid('720196083000285070080374020000940060196523847040610000030801090000702000200439018')!

    const applied = nextOperation(eliminationTechniques, grid)
    console.log(JSON.stringify(applied))

    expect(applied).toEqual(
      [
        {
          technique: 'Naked Triple',
          eliminations: [
            {
              digit: 4,
              coords: [[1, 2],[7,2]]
            },
            {
              digit: 5,
              coords: [[2,2],[3,2],[5,2],[7,2]]
            },
            {
              digit: 7,
              coords: [[3,2],[5,2]]
            }
          ],
          implication: {
            type: 1,
            cells: [[0,2],[6,2],[8,2]],
            digits: [4,5,7]
          }
        }
      ]
    )
  })
})
