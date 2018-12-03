// Get references
const boardEl = document.querySelector('.board');
const nextButtonEl = document.querySelector('button.next');
const solveButtonEl = document.querySelector('button.solve');


// Event handlers
function handleBoardClick(e) {
  // Return early if the user didn't click a cell
  if (!e.target.classList.contains('cell')) return;

  // Set the cell content to the
  const index = parseInt(e.target.dataset.cellindex);
  e.target.textContent = index;
}

function handleNextClick(e) {
  alert('TODO')
}

function handleSolveClick(e) {
  alert('TODO')
}

// Initialize event handlers
boardEl.addEventListener('click', handleBoardClick);
nextButtonEl.addEventListener('click', handleNextClick);
solveButtonEl.addEventListener('click', handleSolveClick);

// Initialize board
const cells = Array.from({ length: 81 }, (_, i) => ({ value: `` }));
renderBoard(cells, boardEl);

function renderBoard(board, el) {
  const blocks = Array.from({ length: 9 }, (_, i) => i)
    .map(blockIndex => getIndexesForBlock(blockIndex))
    .map(cellIndexes => {
      const cells = cellIndexes
        .map(i => {
          const cell = board[i];
          return `<div class="cell" data-cellindex="${i}">${cell.value}</div>`
        })
        .join('');
      return `<div class="block">${cells}</div>`
    })
    .join('');

  el.innerHTML = blocks;
}

function getIndexesForBlock(blockNumber) {
  if (blockNumber < 0 || blockNumber > 9) throw Error('Invalid block number');
  const col = blockNumber % 3;
  const row = Math.floor(blockNumber / 3);
  const root = col * 3 + row * 27;

  return [
    root,
    root + 1,
    root + 2,
    root + 9,
    root + 10,
    root + 11,
    root + 18,
    root + 19,
    root + 20,
  ];
}
