const OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

//
// DOM references
//
const boardEl = document.querySelector('.board');
const nextButtonEl = document.querySelector('button.next');
const solveButtonEl = document.querySelector('button.solve');

// Data stores
let editingCellIndex = -1;
const cells = Array.from({ length: 81 }, (_, i) => {
  return { value: ``, options: new Set(OPTIONS) };
});

//
// Rendering
//
function render() {
  // If the board doesn't exist, render if for the first time with
  // empty cells
  if (document.querySelectorAll('.cell').length !== 81) {
    boardEl.innerHTML = Array
      .from({ length: 9 }, (_, i) => i)
      .map(blockIndex => getCellIndexesForBlock(blockIndex))
      .map(cellIndexes => {
        const cellsHtml = cellIndexes
          .map(i => `<div class="cell" data-cellindex="${i}"></div>`)
          .join('');
        return `<div class="block">${cellsHtml}</div>`
      })
      .join('');
  }

  // Render just what needs to be updated
  cells.forEach((cell, i) => {
    const cellEl = document.querySelector(`[data-cellindex="${i}"]`);

    // Cell editing
    if (i === editingCellIndex) {
      cellEl.classList.add('editing')
    } else {
      cellEl.classList.remove('editing')
    }

    // Content
    const cellValueEl = cellEl.querySelector('.cell__value');
    const cellOptionsEl = cellEl.querySelector('.cell__options');

    if (cell.value) {
      // Show value element
      const textContent = cell.value;
      if (cellValueEl) {
        cellValueEl.textContent = textContent;
      } else {
        cellEl.innerHTML = `<span class="cell__value">${textContent}</span>`
      }
    } else {
      // Show options element
      const textContent = Array.from(cell.options).join(' ');
      if (cellOptionsEl) {
        cellOptionsEl.textContent = textContent;
      } else {
        cellEl.innerHTML = `<span class="cell__options">${textContent}</span>`;
      }
    }
  });

}

//
// Event handlers
//
function handleDocumentClick(e) {
  const parentCell = e.target.closest('.cell');
  if (parentCell) {
    // Edit the clicked cell
    editingCellIndex = parseInt(parentCell.dataset.cellindex);
    return render();
  } else {
    // Stop editing since the click was off-board
    editingCellIndex = -1;
    return render();
  }
}

function handleNextClick() {
  solve();
}

async function handleSolveClick() {
  const unsolved = cells.filter(c => !c.value).length;
  const timePerCell = Math.min(500, 3000 / unsolved); // solve in 3 seconds or less
  while (solve()) {
    await new Promise(res => setTimeout(res, timePerCell));
  }
}

function handleKeydown(e) {
  // Return if no cells are being edited
  if (editingCellIndex < 0 || editingCellIndex > 80) return;

  // Edit a cell value if possible
  if ('123456789'.includes(e.key)) {
    const cell = cells[editingCellIndex];
    if (cell.options.has(e.key)) {
      cells[editingCellIndex].value = e.key;
      updateCellOptions();
    }
    return render();
  }

  if (['Escape', 'Backspace', '0'].includes(e.key)) {
    // Remove a cell value
    cells[editingCellIndex].value = '';
    updateCellOptions();
    return render();
  }

  // Move left
  if (e.key === 'ArrowLeft' && editingCellIndex % 9 > 0) {
    editingCellIndex -= 1;
    return render();
  }

  // Move right
  if (e.key === 'ArrowRight' && editingCellIndex % 9 < 8) {
    editingCellIndex += 1;
    return render();
  }

  // Move up
  if (e.key === 'ArrowUp' && editingCellIndex > 8) {
    editingCellIndex -= 9;
    return render();
  }

  // Move down
  if (e.key === 'ArrowDown' && editingCellIndex < 72) {
    editingCellIndex += 9;
    return render();
  }
}

//
// Util
//
function getCellIndexesForBlock(blockIndex) {
  const firstIndex = (blockIndex % 3) * 3 + Math.floor(blockIndex / 3) * 27;
  return [0, 1, 2, 9, 10, 11, 18, 19, 20].map(offset => firstIndex + offset);
}

function getCellIndexesForRow(rowIndex) {
  return Array.from({ length: 9 }, (_, i) => rowIndex * 9 + i);
}

function getCellIndexesForColumn(colIndex) {
  return Array.from({ length: 9 }, (_, i) => colIndex + i * 9);
}

const getRowIndex = cellIndex => Math.floor(cellIndex / 9);
const getColumnIndex = cellIndex => cellIndex % 9;
const getBlockIndex = cellIndex => Math.floor(cellIndex % 9 / 3) + 3 * Math.floor(cellIndex / 27);

const getRowNeighbors = cellIndex => getCellIndexesForRow(getRowIndex(cellIndex));
const getColumnNeighbors = cellIndex => getCellIndexesForColumn(getColumnIndex(cellIndex));
const getBlockNeighbors = cellIndex => getCellIndexesForBlock(getBlockIndex(cellIndex));

const onSameRow = cellIndexes => new Set(cellIndexes.map(i => getRowIndex(i))).size <= 1;
const onSameColumn = cellIndexes => new Set(cellIndexes.map(i => getColumnIndex(i))).size <= 1;
const onSameBlock = cellIndexes => new Set(cellIndexes.map(i => getBlockIndex(i))).size <= 1;

function getUnsolvedValuesForCells(cellIndexes) {
  const values = new Set();
  cellIndexes.forEach(i => cells[i].options.forEach(val => values.add(val)));
  return Array.from(values);
}

function updateCellOptions() {
  // Set the possibilities wide open for every cell, except those that already have a value
  cells.forEach(c => c.options = c.value ? new Set() : new Set(OPTIONS));

  // Remove neighbor values from options
  cells.forEach((c, i) => {
    const neighborValues = [
        ...getRowNeighbors(i),
        ...getColumnNeighbors(i),
        ...getBlockNeighbors(i),
      ]
      .map(neighborIndex => cells[neighborIndex].value)
      .filter(neighborValue => !!neighborValue);
    new Set(neighborValues).forEach(v => c.options.delete(v));
  });

  // Identify cells that are unique to their row, column, or block
  Array
    .from({ length: 9 }, (_, i) => i)
    .forEach(axisIndex => {
      const identifyUniqueAlongAxis = axisCellIndexes => {
        const axisCells = axisCellIndexes.map(i => cells[i]);

        // Tally the number of cells that have each value as an option
        const tally = axisCells.reduce((accum, curr) => {
          [...curr.options.values()].forEach(val => {
            if (!accum[val]) accum[val] = 0;
            accum[val]++;
          });
          return accum;
        }, {});

        // For all the value options that match just one cell, identify
        // that one cell as unique by setting its options to just the value
        const singles = Object.keys(tally).filter(v => tally[v] === 1);
        singles.forEach(singleValue => {
          const cellWithValue = axisCells.find(c => c.options.has(singleValue));
          cellWithValue.options = new Set(singleValue);
        });
      };

      identifyUniqueAlongAxis(getCellIndexesForRow(axisIndex));
      identifyUniqueAlongAxis(getCellIndexesForColumn(axisIndex));
      identifyUniqueAlongAxis(getCellIndexesForBlock(axisIndex));
    });

  // Candidate line
  Array
    .from({ length: 9 }, (_, i) => i)
    .forEach(blockIndex => {
      const blockCellIndexes = getCellIndexesForBlock(blockIndex);
      getUnsolvedValuesForCells(blockCellIndexes).forEach(val => {
        const cellIndexesWithVal = blockCellIndexes.filter(i => cells[i].options.has(val));
        if (onSameRow(cellIndexesWithVal)) {
          const rowNeighbors = getRowNeighbors(cellIndexesWithVal[0]);
          const rowNeighborsOnOtherBlocks = rowNeighbors.filter(n => getBlockIndex(n) !== blockIndex);
          rowNeighborsOnOtherBlocks.forEach(rowNeighbor => cells[rowNeighbor].options.delete(val));
        } else if (onSameColumn(cellIndexesWithVal)) {
          const colNeighbors = getColumnNeighbors(cellIndexesWithVal[0]);
          const colNeighborsOnOtherBlocks = colNeighbors.filter(n => getBlockIndex(n) !== blockIndex);
          colNeighborsOnOtherBlocks.forEach(colNeighbor => cells[colNeighbor].options.delete(val));
        }
      });
    });

  // Double pair / multiple lines
  Array.from({ length: 9 }, (_, i) => i)
    .forEach(axisIndex => {
      const colCellIndexes = getCellIndexesForColumn(axisIndex);
      getUnsolvedValuesForCells(colCellIndexes).forEach(val => {
        const cellIndexesWithVal = colCellIndexes.filter(i => cells[i].options.has(val));
        if (onSameBlock(cellIndexesWithVal)) {
          const blockNeighbors = getBlockNeighbors(cellIndexesWithVal[0]);
          const blockNeighborsOnOtherCol = blockNeighbors.filter(n => getColumnIndex(n) !== axisIndex);
          blockNeighborsOnOtherCol.forEach(blockNeighbor => cells[blockNeighbor].options.delete(val));
        }
      });

      const rowCellIndexes = getCellIndexesForRow(axisIndex);
      getUnsolvedValuesForCells(rowCellIndexes).forEach(val => {
        const cellIndexesWithVal = rowCellIndexes.filter(i => cells[i].options.has(val));
        if (onSameBlock(cellIndexesWithVal)) {
          const blockNeighbors = getBlockNeighbors(cellIndexesWithVal[0]);
          const blockNeighborsOnOtherRow = blockNeighbors.filter(n => getRowIndex(n) !== axisIndex);
          blockNeighborsOnOtherRow.forEach(blockNeighbor => cells[blockNeighbor].options.delete(val));
        }
      });
    });
}

function solve() {
  const solutionCells = cells.filter(cell => cell.options.size === 1);
  if (!solutionCells.length) {
    alert(`Sorry, I'm not smart enough to help you cheat anymore.`)
    return;
  }

  const cell = solutionCells[0];
  cell.value = [...cell.options.values()][0];
  updateCellOptions();
  render();
  return cell;
}

//
// Attach event handlers
//
nextButtonEl.addEventListener('click', handleNextClick);
solveButtonEl.addEventListener('click', handleSolveClick);
document.addEventListener('keydown', handleKeydown);
document.addEventListener('click', handleDocumentClick);

//
// TODO remove this demo
//
// const DEMO_1  = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
// const DEMO_2 = '300420900070900300009005000090003000028794610000600020000100700001007090002049001';
// DEMO_2.split('').map((v, i) => ({ v, i })).filter(x => x.v !== '0').forEach(x => cells[x.i].value = x.v);
// updateCellOptions();
//
// TODO remove this demo
//

render();
