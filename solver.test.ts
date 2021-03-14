import { getCandidates, GridIndex, parseGrid, Pencilmarks, SudokuGrid } from 'sudoku-master'
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

  it('identifies a pointing pair', () => {
    let grid = prepareGrid('309000470200709800087000900754861239600924758928357641000000596000106307006000104')!

    const applied = nextOperation(eliminationTechniques, grid)

    console.log(JSON.stringify(applied))

    expect(applied).toEqual(
      [
        {
          technique: 'Locked Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[2,7]]
            }
          ],
          implication: {
            type: 1,
            cells: [[7,7],[8,7]],
            digits: [2,8]
          }
        },
        {
          technique: 'Locked Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[2,7]]
            }
          ],
          implication: {
            type: 1,
            cells: [[7,7],[8,7]],
            digits: [2,8]
          }
        }
      ]
    )
  })

  it('identifies a naked pair', () => {
    let grid = prepareGrid('309000470205709803087030900754861239600924758928357641000000596502106387806503124')!

    const applied = nextOperation(eliminationTechniques, grid)

    console.log(JSON.stringify(applied))

    expect(applied).toEqual(
      [
        {
          technique: 'Naked Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[2,3]]
            }
          ],
          implication: {
            type: 1,
            cells: [[2,5],[2,8]],
            digits: [2,5]
          }
        }
      ]
    )
  })
  
  it('identifies a naked triple', () => {
    let grid = prepareGrid('720196083000285070080374020000940060196523847040610000030801090000702000200439018')!

    const applied = nextOperation(eliminationTechniques, grid)

    expect(applied).toEqual(
      [
        {
          technique: 'Naked Triple',
          eliminations: [
            {
              digit: 4,
              coords: [[1,2],[7,2]]
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

  xit('identifies a hidden pair', () => {
    let grid = prepareGrid('720196083000285070080374020070948060196523847040617000030801090000702000200439018')!

    const candidates: [GridIndex, Pencilmarks][] = [
      [ 2, [ 4, 5 ] ],
      [ 6, [ 4, 5 ] ],
      [ 9, [ 3, 4, 6, 9 ] ],
      [ 10, [ 1, 6 ] ],
      [ 11, [ 1, 3, 9 ] ],
      [ 15, [ 1, 4, 6, 9 ] ],
      [ 17, [ 1, 4, 6, 9 ] ],
      [ 18, [ 5, 6, 9 ] ],
      [ 20, [ 1, 9 ] ],
      [ 24, [ 1, 5, 6, 9 ] ],
      [ 26, [ 1, 5, 6, 9 ] ],
      [ 27, [ 3, 5 ] ],
      [ 29, [ 2, 3 ] ],
      [ 32, [ 7, 8 ] ],
      [ 33, [ 1, 2, 3, 5 ] ],
      [ 35, [ 1, 2, 5 ] ],
      [ 45, [ 3, 5, 8 ] ],
      [ 47, [ 2, 3, 8 ] ],
      [ 51, [ 2, 3, 5, 9 ] ],
      [ 52, [ 3, 5 ] ],
      [ 53, [ 2, 5, 9 ] ],
      [ 54, [ 4, 5, 6 ] ],
      [ 56, [ 4, 5, 7 ] ],
      [ 58, [ 5, 6 ] ],
      [ 60, [ 2, 4, 5, 6, 7 ] ],
      [ 62, [ 2, 4, 5, 6 ] ],
      [ 63, [ 4, 5, 6, 8, 9 ] ],
      [ 64, [ 1, 5, 6 ] ],
      [ 65, [ 1, 8, 9 ] ],
      [ 67, [ 5, 6 ] ],
      [ 69, [ 3, 4, 5, 6 ] ],
      [ 70, [ 3, 5 ] ],
      [ 71, [ 4, 5, 6 ] ],
      [ 73, [ 5, 6 ] ],
      [ 74, [ 5, 7 ] ],
      [ 78, [ 5, 6, 7 ] ]
    ]

    grid = { ...grid, candidates: new Map(candidates) }

    const applied = nextOperation(eliminationTechniques, grid)

    expect(applied).toEqual(
      [
        {
          technique: 'Naked Pair',
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
