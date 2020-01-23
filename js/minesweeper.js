
var time = 0;
let diff = 0;
let matrix = [];
let cellTotal = 0;
let totalMines = 0;
let flagCount = 0;
let totalRevealed = 0;
let timer;
let timeValue;
let firstClick = true;
let gameOver = false;

function startGame() {
    buildGrid(diff);
    updateRemainMine();
}

function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;
    diff = difficulty
}

function buildGrid(diff) {

    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";
    firstClick = true;
    gameOver = false;
    document.getElementById("timer").innerHTML = "0";
    document.getElementById("smiley").classList = ["smiley"];
    flagCount = 0;
    totalRevealed = 0

    // set size according to difficulty
    let rows = 9;
    let columns = 9;
    totalMines = 10;
    if (diff === 1) {
      rows = 16;
      columns = 16;
      totalMines = 40;
    }else if (diff === 2) {
      rows = 30;
      columns = 16;
      totalMines = 99;
    }
    cellTotal = rows*columns;

    // Build DOM Grid
    var tile;
    matrix = [];
    for (var y = 0; y < rows; y++) {
        matrix[y] = [];
        for (var x = 0; x < columns; x++) {
          tile = createTile(x,y);
          grid.appendChild(tile);
          // Create matrix with tile object to store tile states.

          let newTile = {
            isMine: false,
            flagged: false,
            adjacentMine: 0,
            revealed: false,
            div : tile
          }
          matrix[y][x] = newTile;
        }
    }

    var style = window.getComputedStyle(tile);

    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));

    grid.style.width = (columns * width) + "px";
    grid.style.height = (rows * height) + "px";
}

function createTile(x,y) {
    var tile = document.createElement("div");

    tile.classList.add("tile");
    tile.classList.add("hidden");

    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.getElementById("smiley").classList.add("face_limbo")
    })
    tile.addEventListener("mouseup", (e) => {
      e.preventDefault();
      document.getElementById("smiley").classList.remove("face_limbo")
      handleTileClick(e, x, y);
    } ); // All Clicks

    return tile;
}

const setUpMine = (x, y) => {
  // only run once right after first click. will set up mines

  for (var i = 0; i < totalMines; i++) {
    let col = 0;
    let row = 0;
    if (diff === 0) {
      col = randomIntFromInterval(0, 8);
      row = randomIntFromInterval(0, 8);
    }else if (diff === 1) {
      col = randomIntFromInterval(0, 15);
      row = randomIntFromInterval(0, 15);
    }else if (diff === 2){
      col = randomIntFromInterval(0, 15);
      row = randomIntFromInterval(0, 29);
    }
    let count = 0;

    if (matrix[row][col].isMine) {i--;}
    else if (row === y && col === x) { i--; } //first click can not be mine.
    else{
      matrix[row][col].isMine = true;
      // make surrounding cell.adjacentMine++
      const minePlusOne = (x, y) => {matrix[y][x].adjacentMine +=1;}
      checkAroundHelper(minePlusOne, col, row);
    }
  }
}

const gameSuccess = (success) => {
  gameOver = true;
  window.clearInterval(timer);
  if (success) {
    document.getElementById("smiley").classList.add("face_win")
    alert(`You have WON! your time used is ${timeValue} seconds`)
  }else{
    document.getElementById("smiley").classList.add("face_lose")
    setTimeout(()=>{alert("Too bad, you lost.")}, 100)
  }
}

function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}

function handleTileClick(event, x, y) {
  if (gameOver) {
    return;
  }
  let tile = matrix[y][x];
    // Left Click
  if (event.which === 1) {
      //reveal the tile
      if (firstClick) {
        firstClick = false;
        startTimer();
        setUpMine(x, y);
      }
      revealTile(x, y);
  }
  // Middle Click
  else if (event.which === 2) {
      //try to reveal adjacent tiles
      if (tile.isRevealed && countAdjacentFlag(x, y) === tile.adjacentMine) {
        checkAroundHelper(revealTile, x, y);
      }
  }
  // Right Click
  else if (event.which === 3) {
    //toggle a tile flag
    if (!tile.isRevealed) {
      tile.flagged = !tile.flagged;
      if (tile.flagged) {
        // tileDiv.classList.remove("hidden")
        tile.div.classList.add("flag")
        flagCount++;
        updateRemainMine();
      }else{
        tile.div.classList.remove("flag")
        // tileDiv.classList.add("hidden")
        flagCount--;
        updateRemainMine();
      }
    }
    // I added middle click functionality here
    // so MacOs trackpad can do right click on numbers
    // and have effect just like middle click.
    if (tile.isRevealed && countAdjacentFlag(x, y) === tile.adjacentMine) {
      checkAroundHelper(revealTile, x, y);
    }
  }
}

const revealTile = (x, y) => {
  // reveal tile at yx, this should be recursive for some cases.
  let tile = matrix[y][x];

  if (!tile.isRevealed && !tile.flagged) {
      tile.isRevealed = true;
    if (tile.isMine) {
      // Dead
      tile.div.classList.add("mine_hit")
      gameSuccess(false)
    }else{
      totalRevealed++;
      if (tile.adjacentMine === 0) {
        tile.div.classList.remove("hidden")
        // reveal adjacent cells.
        checkAroundHelper(revealTile, x, y);
      }else{
        // Show number of mine nearby.
        tile.div.classList.add(`tile_${tile.adjacentMine}`);
      }

      if (totalRevealed === cellTotal - totalMines) {
        gameSuccess(true)
      }
    }
  }
}

const updateRemainMine = () => {
  let remain = totalMines - flagCount;
  document.getElementById("flagCount").innerHTML = remain.toString();

}

const countAdjacentFlag = (x, y) => {
  // return adjacent flags around (y,x)
  let count = 0;
  const checkFlag = (x, y) => {
    if (matrix[y][x].flagged) {count++;}
  }
  checkAroundHelper(checkFlag, x, y)
  return count;
}

function startTimer() {
  window.clearInterval(timer);
  timeValue = 0;
  timer = window.setInterval(onTimerTick, 1000);
}

function onTimerTick() {
    timeValue++;
    updateTimer();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}

function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
  // https://stackoverflow.com/a/7228322
}

const checkAroundHelper = (func, x, y) => {
  // to reduce duplicated code.
  for (let i = -1; i <= 1; i++) {
    if (matrix[y+i] !== undefined) {
      for (let j = -1; j <= 1; j++) {
        if (matrix[y+i][x+j] !== undefined) {
          func(x+j, y+i);
        }
      }
    }
  }
}
