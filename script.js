// Get references
const boardEl = document.querySelector('.board');
const nextButtonEl = document.querySelector('button.next');
const solveButtonEl = document.querySelector('button.solve');

function getEditingCell() {
  return document.querySelector('.cell.editing');
}

// Event handlers
function handleDocumentClick(e) {
  if (e.target.classList.contains('cell')) {
    // Edit the clicked cell
    const cellIndex = parseInt(e.target.dataset.cellindex);
    cells.forEach(cell => cell.editing = false);
    cells[cellIndex].editing = true;
    renderBoard(cells, boardEl);
    return;
  } else if (getEditingCell()) {
    // Stop editing since the click was off-board
    cells.forEach(cell => cell.editing = false);
    renderBoard(cells, boardEl);
    return;
  }
}

function handleNextClick() {
  // Update possibilities
  cells.forEach((cell, index) => {
    if (cell.value) return;
    const possible = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    const neighbors = new Set([
      ...getIndexesOnRow(index),
      ...getIndexesOnColumn(index),
      ...getIndexesOnBlock(index)]
    );

    neighbors.forEach(neighborIndex => {
      const neighbor = cells[neighborIndex];
      if (neighbor.value) possible.delete(neighbor.value);
    });

    cell.possible = possible;
  });

  const solutionCells = cells.filter(cell => cell.possible && cell.possible.size === 1);
  if (solutionCells.length === 0) {
    return null;
  }

  const cell = solutionCells[getRandomIntInclusive(0, solutionCells.length - 1)];
  cell.value = [...cell.possible.values()][0];
  cells.forEach(cell => delete cell.possible);

  renderBoard(cells, boardEl);
  return cell;
}

async function handleSolveClick() {
  const unsolved = cells.filter(c => !c.value).length;
  const timePerCell = Math.min(500, 3000 / unsolved); // solve in 3 seconds or less
  while (handleNextClick()) {
    await new Promise(res => setTimeout(res, timePerCell));
  }
}

function handleKeydown(e) {
  // Get the cell being actively edited
  const editingCell = getEditingCell();
  if (!editingCell) return;
  const cellIndex = parseInt(editingCell.dataset.cellindex);

  // Edit a cell value
  if ('123456789'.includes(e.key)) {
    cells[cellIndex].value = e.key;
    renderBoard(cells, boardEl);
    return;
  }

  if (['Escape', 'Backspace'].includes(e.key)) {
    // Remove a cell value
    cells[cellIndex].value = '';
    renderBoard(cells, boardEl);
    return;
  }

  // Move left
  if (e.key === 'ArrowLeft' && cellIndex % 9 > 0) {
    cells[cellIndex].editing = false;
    cells[cellIndex - 1].editing = true;
    renderBoard(cells, boardEl);
    return;
  }

  // Move right
  if (e.key === 'ArrowRight' && cellIndex % 9 < 8) {
    cells[cellIndex].editing = false;
    cells[cellIndex + 1].editing = true;
    renderBoard(cells, boardEl);
    return;
  }

  // Move up
  if (e.key === 'ArrowUp' && cellIndex > 8) {
    cells[cellIndex].editing = false;
    cells[cellIndex - 9].editing = true;
    renderBoard(cells, boardEl);
    return;
  }

  // Move down
  if (e.key === 'ArrowDown' && cellIndex < 72) {
    cells[cellIndex].editing = false;
    cells[cellIndex + 9].editing = true;
    renderBoard(cells, boardEl);
    return;
  }
}

// Initialize event handlers
nextButtonEl.addEventListener('click', handleNextClick);
solveButtonEl.addEventListener('click', handleSolveClick);
document.addEventListener('keydown', handleKeydown);
document.addEventListener('click', handleDocumentClick);

// Initialize board
const cells = Array.from({ length: 81 }, (_, i) => {
  return { value: ``, editing: false };
});

// TODO remove this demo
const DEMO = ["5", "3", "", "", "7", "", "", "", "", "6", "", "", "1", "9", "5", "", "", "", "", "9", "8", "", "", "", "", "6", "", "8", "", "", "", "6", "", "", "", "3", "4", "", "", "8", "", "3", "", "", "1", "7", "", "", "", "2", "", "", "", "6", "", "6", "", "", "", "", "2", "8", "", "", "", "", "4", "1", "9", "", "", "5", "", "", "", "", "8", "", "", "7", "9"];
DEMO.forEach((v,i) => cells[i].value = v);

renderBoard(cells, boardEl);

function renderBoard(cells, el) {
  // Validate that only one cell is being edited
  if (cells.filter(c => c.editing).length > 1) {
    throw Error('Invalid board. Multiple edited cells');
  }

  const blocks = Array.from({ length: 9 }, (_, i) => i)
    .map(blockIndex => getIndexesForBlock(blockIndex))
    .map(cellIndexes => {
      const cellsHtml = cellIndexes
        .map(i => {
          const cell = cells[i];
          const classes = ['cell', cell.editing ? 'editing' : null].filter(x => x);
          return `<div class="${classes.join(' ')}" data-cellindex="${i}">${cell.value}</div>`
        })
        .join('');
      return `<div class="block">${cellsHtml}</div>`
    })
    .join('');

  el.innerHTML = blocks;
}

function getIndexesForBlock(blockNumber) {
  if (blockNumber < 0 || blockNumber > 9) throw Error('Invalid block number');
  const col = blockNumber % 3;
  const row = Math.floor(blockNumber / 3);
  const first = col * 3 + row * 27;

  return [
    first,
    first + 1,
    first + 2,
    first + 9,
    first + 10,
    first + 11,
    first + 18,
    first + 19,
    first + 20,
  ];
}

function getIndexesOnRow(cellIndex) {
  const row = Math.floor(cellIndex / 9);
  const first = row * 9;
  return [
    first,
    first + 1,
    first + 2,
    first + 3,
    first + 4,
    first + 5,
    first + 6,
    first + 7,
    first + 8,
  ];
}

function getIndexesOnColumn(cellIndex) {
  const col = cellIndex % 9;
  const first = col;
  return [
    first,
    first + 1 * 9,
    first + 2 * 9,
    first + 3 * 9,
    first + 4 * 9,
    first + 5 * 9,
    first + 6 * 9,
    first + 7 * 9,
    first + 8 * 9,
  ];
}

function getIndexesOnBlock(cellIndex) {
  const blockSets = Array.from({ length: 9 }, (_, i) => getIndexesForBlock(i));
  return blockSets.find(set => set.includes(cellIndex));
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
