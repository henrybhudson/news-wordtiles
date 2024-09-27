const gridContainer = document.querySelector(".grid-container");
const ANSWER = "PILEAREACOATEND*";

/*
To generate a new grid with a given word at the top, run

generateBoard(<word>).then((boardString) => {
  // ... stuff here with boardString
});

*/

/*
Pseudocode for algorithm

# place initial word
# base: if all rows are filled check if all valid. return if so

# recursive: 
# for current row, get word length (3/4)
# iterate over words of said length
# for each word:
    # place it in current row
    # for each column:
        # get vertical word formed so far
        # check if exists in prefix_list
        # if not, prune tree (skip row word)
    # recursively call each row
    # if call returns valid, return up (mutable lists)
    # else backtrack and try next word
*/

const SIZE = 4;
let usedWords = new Set();
let wordList;
let prefixSets;

const getWordlist = async () => {
  const res = await fetch(
    "https://raw.githubusercontent.com/henrybhudson/news-wordtiles/main/wordlist.csv"
  );
  const data = await res.text();
  return csvToWordlist(data);
};

const csvToWordlist = (words) => {
  let wordlist = [];
  let count = 0;

  for (let line of words.split("\n")) {
    if (count === 0) {
      count++;
      continue;
    }
    count++;
    wordlist.push(line.split(",")[0].toUpperCase());
  }

  return wordlist;
};

const createPrefixSets = (words) => {
  const wordList = { [SIZE - 1]: new Set(), [SIZE]: new Set() };
  const prefixSets = { [SIZE - 1]: new Set(), [SIZE]: new Set() };

  words.forEach((line) => {
    const word = line.trim().toUpperCase();
    const wordLength = word.length;

    if (SIZE - 1 <= wordLength && wordLength <= SIZE) {
      wordList[wordLength].add(word); // Use wordLength here

      for (let i = 1; i <= wordLength; i++) {
        prefixSets[wordLength].add(word.slice(0, i)); // Use wordLength here
      }
    }
  });

  return { prefixSets, wordList };
};

const printBoard = (board) => {
  board.forEach((row) => {
    console.log(row.join(""));
  });
};

const getBoard = (topWord, wordList, prefixSets) => {
  usedWords = new Set();

  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  board[0] = topWord.split("");
  usedWords.add(topWord);

  if (solveBoard(board, wordList, prefixSets)) {
    return board.map((row) => row.join("")).join("") + "*";
  }

  return false;
};

const columnsAreValid = (board, prefixSets) => {
  for (let col = 0; col < SIZE; col++) {
    const numRows = col === SIZE - 1 ? SIZE - 1 : SIZE;
    const columnWord = Array.from(
      { length: numRows },
      (_, row) => board[row][col]
    ).join("");

    if (!prefixSets[numRows].has(columnWord) || usedWords.has(columnWord)) {
      return false;
    }
  }

  return true;
};

const partialColumnsAreValid = (board, rowIndex, prefixSets) => {
  for (let col = 0; col < SIZE; col++) {
    const numRows = col === SIZE - 1 ? SIZE - 1 : SIZE;
    const columnWord = Array.from(
      { length: Math.min(numRows, rowIndex + 1) },
      (_, row) => board[row][col]
    ).join("");

    if (!prefixSets[numRows].has(columnWord)) {
      return false;
    }
  }

  return true;
};

const solveBoard = (board, wordList, prefixSets, rowIndex = 1) => {
  if (rowIndex === SIZE) {
    return columnsAreValid(board, prefixSets);
  }

  const wordLength = rowIndex === SIZE - 1 ? SIZE - 1 : SIZE;
  const words = wordList[wordLength];

  for (let word of words) {
    word = word.toUpperCase();
    board[rowIndex] = word.split("");
    // printBoard(board);

    if (!usedWords.has(word)) {
      usedWords.add(word);

      if (partialColumnsAreValid(board, rowIndex, prefixSets)) {
        if (solveBoard(board, wordList, prefixSets, rowIndex + 1)) {
          return true;
        }
      }

      usedWords.delete(word);
    }

    board[rowIndex] = Array(SIZE).fill("");
  }

  return false;
};

const generateBoard = async (topWord) => {
  const words = await getWordlist();
  const { prefixSets, wordList } = createPrefixSets(words);
  return getBoard(topWord, wordList, prefixSets);
};

// Function to scramble the letters in a string
function scrambleString(str) {
  return str
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Generate a 4x4 grid with scrambled letters
const generateGrid = (board) => {
  const updated = board + " "; // Add an additional space to the grid
  updated.split("").forEach((letter) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.textContent = letter;
    cell.draggable = true;

    // Change background color if the cell is empty (space)
    if (letter === " ") {
      cell.style.backgroundColor = "black"; // Set background color to black
    }

    // Add drag event listeners
    cell.addEventListener("dragstart", dragStart);
    cell.addEventListener("dragover", dragOver);
    cell.addEventListener("drop", drop);

    gridContainer.appendChild(cell);
  });
};

// Handle drag start
function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.textContent);
  event.dataTransfer.setData(
    "cellIndex",
    Array.from(gridContainer.children).indexOf(event.target)
  );
  event.target.classList.add("dragging"); // Add the dragging class
}

// Allow drop
function dragOver(event) {
  event.preventDefault();
}

// Handle drop
function drop(event) {
  event.preventDefault();
  const draggedLetter = event.dataTransfer.getData("text/plain");
  const draggedIndex = event.dataTransfer.getData("cellIndex");
  const targetIndex = Array.from(gridContainer.children).indexOf(event.target);

  // Check if the target cell is a space
  if (event.target.textContent === " ") {
    // Swap letters only if they are adjacent
    if (isAdjacent(draggedIndex, targetIndex)) {
      // Store the letter of the target cell
      const targetLetter = event.target.textContent;

      // Swap the letters
      event.target.textContent = draggedLetter;

      // Update the background color if necessary
      if (draggedLetter === " ") {
        event.target.style.backgroundColor = "black"; // Set to black if dragged letter is space
      } else {
        event.target.style.backgroundColor = "#3993DD"; // Reset to original color
      }

      gridContainer.children[draggedIndex].textContent = targetLetter;

      // Update the background color of the dragged cell
      if (targetLetter === " ") {
        gridContainer.children[draggedIndex].style.backgroundColor = "black"; // Set to black if target letter is space
      } else {
        gridContainer.children[draggedIndex].style.backgroundColor = "#3993DD"; // Reset to original color
      }

      // Check if the board matches the answer
      checkAnswer();
    }
  }

  // Remove the dragging class from the original cell after drop
  gridContainer.children[draggedIndex].classList.remove("dragging");
}

// Check if the two indices are adjacent in a 4x4 grid
function isAdjacent(index1, index2) {
  const row1 = Math.floor(index1 / 4);
  const col1 = index1 % 4;
  const row2 = Math.floor(index2 / 4);
  const col2 = index2 % 4;

  return (
    (Math.abs(row1 - row2) === 1 && col1 === col2) ||
    (Math.abs(col1 - col2) === 1 && row1 === row2)
  );
}

// Check if the current board matches the answer
function checkAnswer() {
  let currentString = "";

  // Concatenate the text content of all cells to form a string
  for (let cell of gridContainer.children) {
    currentString += cell.textContent;
  }

  // Compare with the ANSWER
  if (currentString.trim().replace(/ /g, "*") === ANSWER) {
    // If they match, change all cells to green except those with a space
    for (let cell of gridContainer.children) {
      if (cell.textContent !== " ") {
        cell.style.backgroundColor = "green"; // Change to green
      }
    }
  }
}

// Initialize grid with scrambled letters
generateGrid(scrambleString(ANSWER.replace(/\*/g, " "))); // Replace asterisks with spaces and scramble
