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

    expect(applied).toEqual(
      [
        {
          technique: 'Locked Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[2, 7]]
            }
          ],
          implication: {
            type: 1,
            cells: [[7, 7], [8, 7]],
            digits: [2, 8]
          }
        },
        {
          technique: 'Locked Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[2, 7]]
            }
          ],
          implication: {
            type: 1,
            cells: [[7, 7], [8, 7]],
            digits: [2, 8]
          }
        }
      ]
    )
  })

  it('identifies a naked pair', () => {
    let grid = prepareGrid('309000470205709803087030900754861239600924758928357641000000596502106387806503124')!

    const applied = nextOperation(eliminationTechniques, grid)

    expect(applied).toEqual(
      [
        {
          technique: 'Naked Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[2, 3]]
            }
          ],
          implication: {
            type: 1,
            cells: [[2, 5], [2, 8]],
            digits: [2, 5]
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
              coords: [[1, 2], [7, 2]]
            },
            {
              digit: 5,
              coords: [[2, 2], [3, 2], [5, 2], [7, 2]]
            },
            {
              digit: 7,
              coords: [[3, 2], [5, 2]]
            }
          ],
          implication: {
            type: 1,
            cells: [[0, 2], [6, 2], [8, 2]],
            digits: [4, 5, 7]
          }
        }
      ]
    )
  })

  it('identifies locked candidates', () => {
    const grid = parseGrid(`
      +----------------+--------------+-----------------+
      | 7     2   45   | 1   9   6    | 45    8   3     |
      | 3469  16  139  | 2   8   5    | 1469  7   1469  |
      | 569   8   19   | 3   7   4    | 1569  2   1569  |
      +----------------+--------------+-----------------+
      | 35    7   23   | 9   4   8    | 1235  6   125   |
      | 1     9   6    | 5   2   3    | 8     4   7     |
      | 358   4   238  | 6   1   7    | 2359  35  259   |
      +----------------+--------------+-----------------+
      | 456   3   457  | 8   56  1    | 24567 9   2456  |
      | 45689 156 189  | 7   56  2    | 3456  35  456   |
      | 2     56  57   | 4   3   9    | 567   1   8     |
      +----------------+--------------+-----------------+
    `)

    const applied = nextOperation(eliminationTechniques, grid!)

    expect(applied).toEqual(
      [
        {
          technique: 'Locked Candidates Type 1 (Pointing)',
          eliminations: [
            {
              digit: 5,
              coords: [[2, 0], [6, 0], [7, 0]]
            }
          ],
          implication: {
            type: 0,
            house: {
              type: 'box',
              index: 3,
              cells: [27, 28, 29, 36, 37, 38, 45, 46, 47]
            },
            digit: 5
          }
        },
        {
          technique: 'Locked Candidates Type 2 (Claiming)',
          eliminations: [
            {
              digit: 5,
              coords: [[6, 0], [6, 2], [7, 0], [8, 2]]
            }
          ],
          implication: {
            type: 0,
            house: {
              type: 'col',
              index: 1,
              cells: [1, 10, 19, 28, 37, 46, 55, 64, 73]
            },
            digit: 5
          }
        }
      ]
    )
  })

  it('identifies a hidden pair', () => {
    const grid = parseGrid(`
      +-----------------+------------------------+------------------+
      | 7    46  2      | 468    9      14568    | 3   168   456    |
      | 8    346 5      | 23467  12347  23467    | 14  2679  24679  |
      | 1    346 9      | 234678 234578 234678   | 458 2678  2467   |
      +-----------------+------------------------+------------------+
      | 25   9   138    | 238    6      12358    | 7   4     23     |
      | 246  12  3467   | 23479  12347  23479    | 69  5     8      |
      | 246  258 34678  | 234789 234578 234789   | 69  23    1      |
      +-----------------+------------------------+------------------+
      | 4569 7   1468   | 34689  348    34689    | 2   13689 34569  |
      | 3    128 468    | 5      2478   246789   | 148 6789  4679   |
      | 2469 258 468    | 1      23478  2346789  | 458 36789 34679  |
      +-----------------+------------------------+------------------+
    `)

    const applied = nextOperation(eliminationTechniques, grid!)

    expect(applied).toEqual(
      [
        {
          technique: 'Hidden Pair',
          eliminations: [
            {
              digit: 2,
              coords: [[3, 5]]
            },
            {
              digit: 3,
              coords: [[3, 5]]
            },
            {
              digit: 4,
              coords: [[0, 5]]
            },
            {
              digit: 6,
              coords: [[0, 5]]
            },
            {
              digit: 8,
              coords: [[0, 5], [3, 5]]
            }
          ],
          implication: {
            type: 1,
            cells: [[0, 5], [3, 5]],
            digits: [1, 5]
          }
        }
      ]
    )
  })

  it('identifies a hidden triple', () => {
    const grid = parseGrid(`
      +-------------------+--------------+----------------+
      | 139   168  168    | 7   2   4    | 13689 368 5    |
      | 359   2    48     | 569 1   359  | 48    7   369  |
      | 13579 1467 1567   | 569 8   359  | 1369  346 2    |
      +-------------------+--------------+----------------+
      | 178   9    147    | 18  3   6    | 2     5   47   |
      | 6     14   2      | 59  7   159  | 39    34  8    |
      | 78    5    3      | 2   4   89   | 679   1   69   |
      +-------------------+--------------+----------------+
      | 4     1678 15678  | 3   9   18   | 5678  2   16   |
      | 157   3    1578   | 18  6   2    | 4578  9   47   |
      | 2     168  9      | 4   5   7    | 368   368 136  |
      +-------------------+--------------+----------------+
    
    `)

    const applied = nextOperation(eliminationTechniques, grid!)

    expect(applied).toEqual(
      [
        {
          technique: 'Hidden Triple',
          eliminations: [
            {
              digit: 6,
              coords: [[6, 6]]
            },
            {
              digit: 8,
              coords: [[6, 6], [7, 6]]
            }
          ],
          implication: {
            type: 1,
            cells: [[6, 6], [7, 6], [7, 8]],
            digits: [4, 5, 7]
          }
        }
      ]
    )
  })

  it('identifies an X-wing', () => {
    const grid = parseGrid(`
      +---------------+--------------+--------------+
      | 3   16   9    | 26  18  258  | 4   7   25   |
      | 2   146  5    | 7   14  9    | 8   16  3    |
      | 14  8    7    | 46  3   25   | 9   16  25   |
      +---------------+--------------+--------------+
      | 7   5    4    | 8   6   1    | 2   3   9    |
      | 6   13   13   | 9   2   4    | 7   5   8    |
      | 9   2    8    | 3   5   7    | 6   4   1    |
      +---------------+--------------+--------------+
      | 14  1347 13   | 24  478 28   | 5   9   6    |
      | 5   49   2    | 1   49  6    | 3   8   7    |
      | 8   79   6    | 5   79  3    | 1   2   4    |
      +---------------+--------------+--------------+    
    `)

    const applied = nextOperation(eliminationTechniques, grid!)

    expect(applied).toEqual(
      [
        {
          technique: 'X-Wing',
          eliminations: [
            {
              digit: 4,
              coords: [[6, 1], [6, 4]]
            }
          ],
          implication: {
            type: 2,
            line: 'row',
            digit: 4,
            baseSet: [1, 7],
            coverSet: [1, 4]
          }
        },
        {
          technique: 'X-Wing',
          eliminations: [
            {
              digit: 4,
              coords: [[6, 1], [6, 4]]
            }
          ],
          implication: {
            type: 2,
            line: 'col',
            digit: 4,
            baseSet: [0, 3],
            coverSet: [2, 6]
          }
        }
      ]
    )
  })

  it('identifies a swordfish', () => {
    const grid = parseGrid(`
      +--------------+---------------+--------------+
      | 189 5   89   | 47  3   17    | 6   49  2    |
      | 6   4   2    | 8   9   5     | 3   1   7    |
      | 19  3   7    | 46  2   16    | 8   459 59   |
      +--------------+---------------+--------------+
      | 89  2   3    | 5   18  4     | 7   69  169  |
      | 4   89  6    | 37  178 378   | 5   2   19   |
      | 5   7   1    | 9   6   2     | 4   8   3    |
      +--------------+---------------+--------------+
      | 2   1   4    | 367 578 3678  | 9   56  568  |
      | 7   6   58   | 1   58  9     | 2   3   4    |
      | 3   89  589  | 2   4   68    | 1   7   568  |
      +--------------+---------------+--------------+
    `)

    const applied = nextOperation(eliminationTechniques, grid!)

    expect(applied).toEqual(
      [
        {
          technique: 'Swordfish',
          eliminations: [
            {
              digit: 8,
              coords: [[8, 2], [4, 4], [6, 4]]
            }
          ],
          implication: {
            type: 2,
            line: 'row',
            digit: 8,
            baseSet: [0, 3, 7],
            coverSet: [0, 2, 4]
          }
        },
        {
          technique: 'Swordfish',
          eliminations: [
            {
              digit: 8,
              coords: [[4, 4], [6, 4], [8, 2]]
            }
          ],
          implication: {
            type: 2,
            line: 'col',
            digit: 8,
            baseSet: [1, 5, 8],
            coverSet: [4, 6, 8]
          }
        }
      ]
    )
  })

  it('identifies a jellyfish', () => {
    const grid = parseGrid(`
      +--------------+------------------+---------------+
      | 356 2   4    | 167  9     156   | 17  1367 8    |
      | 8   56  36   | 4    167   2     | 9   1367 156  |
      | 7   1   9    | 36   368   3568  | 2   4    56   |
      +--------------+------------------+---------------+
      | 169 7   5    | 8    126   4     | 3   129  12   |
      | 2   4   16   | 9    136   136   | 5   8    7    |
      | 19  3   8    | 5    12    7     | 6   129  4    |
      +--------------+------------------+---------------+
      | 13  8   2    | 1367 13467 136   | 147 5    9    |
      | 156 56  7    | 2    48    9     | 48  16   3    |
      | 4   9   136  | 137  5     138   | 178 1267 126  |
      +--------------+------------------+---------------+
    `)

    const applied = nextOperation(eliminationTechniques, grid!)

    expect(applied).toEqual(
      [
        {
          technique: 'Jellyfish',
          eliminations: [
            {
              digit: 1,
              coords: [[6, 0], [4, 4], [6, 4], [0, 7], [8, 7], [8, 8]]
            }
          ],
          implication: {
            type: 2,
            line: 'row',
            digit: 1,
            baseSet: [1, 3, 5, 7],
            coverSet: [0, 4, 7, 8]
          }
        },
        {
          technique: 'Jellyfish',
          eliminations: [
            {
              digit: 1,
              coords: [[0, 7], [4, 4], [6, 0], [6, 4], [8, 7], [8, 8]]
            }
          ],
          implication: {
            type: 2,
            line: 'col',
            digit: 1,
            baseSet: [2, 3, 5, 6],
            coverSet: [0, 4, 6, 8]
          }
        }
      ]
    )
  })
})
