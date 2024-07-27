/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable max-classes-per-file */

// Constants
const DEFAULT_BACKGROUND_COLOR = 'black';
const TILE_TYPES = {
  EMPTY: 'white',
  WALL: 'black',
  ERROR: 'red',
};

function v(argumentsList, args) {
  if (!argumentsList) throw new Error('No arguments list provided to validate');
  if (!args) throw new Error('No arguments provided to validate (you may have passed an empty/null/undefined object)');
  const argList = argumentsList.split(', ');
  const argKeys = Object.keys(args);
  argKeys.forEach((key) => {
    if (!argList.includes(key)) throw new Error(`Invalid argument: ${key}`);
  });
  argList.forEach((arg) => {
    if (!argKeys.includes(arg)) throw new Error(`Missing argument: ${arg}`);
  });
}

class DisplayCell {
  constructor(args) {
    v('xIndex, yIndex, edgeLength', args);
    const { xIndex, yIndex, edgeLength } = args;
    this.xIndex = xIndex;
    this.yIndex = yIndex;
    this.locationX = xIndex * edgeLength;
    this.locationY = yIndex * edgeLength;
    this.edgeLength = edgeLength;
    this.mostRecentFill = null;
  }

  getIndexX() { return this.xIndex; }

  getIndexY() { return this.yIndex; }

  getLocationX() { return this.locationX; }

  getLocationY() { return this.locationY; }

  getEdgeLength() { return this.edgeLength; }

  getMostRecentFill() { return this.mostRecentFill; }

  setMostRecentFill(args) {
    v('mostRecentFill', args);
    const { mostRecentFill } = args;
    this.mostRecentFill = mostRecentFill;
  }

  getRedraw(args) {
    v('tileType', args);
    const { tileType } = args;
    if (this.getMostRecentFill() !== tileType) {
      this.setMostRecentFill({ mostRecentFill: tileType });
      return {
        cellFill: this.getMostRecentFill(),
        cellRect: [this.getLocationX(), this.getLocationY(), this.getEdgeLength(), this.getEdgeLength()],
      };
    }
    return null;
  }
}

class DisplayRow {
  constructor(args) {
    v('cellEdgeLength, width, yIndex', args);
    const { cellEdgeLength, width, yIndex } = args;
    this.width = width;
    this.cellEdgeLength = cellEdgeLength;
    this.row = [];
    for (let xIndex = 0; xIndex < width / cellEdgeLength; xIndex += 1) {
      this.row.push(new DisplayCell({ xIndex, yIndex, edgeLength: this.cellEdgeLength }));
    }
  }

  getRow() { return this.row; }

  getCell(args) {
    v('xIndex', args);
    const { xIndex } = args;
    return this.getRow()[xIndex];
  }
}

class DisplayGrid {
  constructor(args) {
    v('width, height, cellEdgeLength, zoomSpeed', args);
    const {
      width, height, cellEdgeLength, zoomSpeed,
    } = args;
    this.width = width + cellEdgeLength * 2;
    this.height = height + cellEdgeLength * 2;
    this.cellEdgeLength = cellEdgeLength;
    this.zoomSpeed = zoomSpeed;
    this.timeout = null;
    this.displayRows = [];
    this.createNewCells();
  }

  getWidth() { return this.width; }

  getHeight() { return this.height; }

  getCellEdgeLength() { return this.cellEdgeLength; }

  getZoomSpeed() { return this.zoomSpeed; }

  getDisplayRow(args) {
    v('yIndex', args);
    const { yIndex } = args;
    return this.getDisplayRows()[yIndex];
  }

  getDisplayRows() { return this.displayRows; }

  getDisplayCell(args) {
    v('xIndex, yIndex', args);
    const { xIndex, yIndex } = args;
    const displayRow = this.getDisplayRow({ yIndex });
    return displayRow.getCell({ xIndex });
  }

  setDisplayRows(args) {
    v('displayRows', args);
    const { displayRows } = args;
    this.displayRows = displayRows;
  }

  setWidth(width) { this.width = width; }

  setHeight(height) { this.height = height; }

  setZoomSpeed(zoomSpeed) { this.zoomSpeed = zoomSpeed; }

  setZoom(args) {
    v('delta', args);
    const { delta } = args;
    const maximumZoomIncrement = 10;
    const MINIMUM_CELL_EDGE_LENGTH = 20;
    let actualDelta = delta;
    if (delta > maximumZoomIncrement) actualDelta = maximumZoomIncrement;
    if (delta < -maximumZoomIncrement) actualDelta = -maximumZoomIncrement;

    const zoomPercentage = 1 + this.getZoomSpeed() * (actualDelta / 10);

    const newCellEdgeLength = Math.max(MINIMUM_CELL_EDGE_LENGTH, Math.floor(this.getCellEdgeLength() * zoomPercentage));

    if (newCellEdgeLength !== this.getCellEdgeLength()) {
      this.cellEdgeLength = newCellEdgeLength;
      this.createNewCells();
    }
  }

  createNewCells() {
    const newDisplayRows = [];
    const cellsPerColumn = this.getHeight() / this.getCellEdgeLength();
    const width = this.getWidth();
    const cellEdgeLength = this.getCellEdgeLength();
    for (let yIndex = 0; yIndex < cellsPerColumn; yIndex += 1) {
      const newRow = new DisplayRow({ cellEdgeLength, width, yIndex });
      newDisplayRows.push(newRow);
    }
    this.setDisplayRows({ displayRows: newDisplayRows });
  }
}

class GameCell {
  constructor(args) {
    v('hasMouse, xIndex, yIndex', args);
    const { hasMouse, xIndex, yIndex } = args;
    this.hasMouse = hasMouse;
    this.xIndex = xIndex;
    this.yIndex = yIndex;
  }

  getTileType() {
    if (this.getHasMouse()) return TILE_TYPES.WALL;
    return TILE_TYPES.EMPTY;
  }

  getHasMouse() { return this.hasMouse; }

  setHasMouse(args) {
    v('hasMouse', args);
    const { hasMouse } = args;
    this.hasMouse = hasMouse;
  }
}

class GameRow {
  constructor(args) {
    v('yIndex, cellCount', args);
    const { yIndex, cellCount } = args;
    this.row = [];
    for (let xIndex = 0; xIndex < cellCount; xIndex += 1) {
      this.row.push(new GameCell({ hasMouse: false, xIndex, yIndex }));
    }
  }

  getRow() { return this.row; }

  getCell(args) {
    v('xIndex', args);
    const { xIndex } = args;
    return this.getRow()[xIndex];
  }
}

class Game {
  constructor(args) {
    v('width, height, cellEdgeLength, zoomSpeed', args);
    const {
      width, height, cellEdgeLength, zoomSpeed,
    } = args;
    this.locationOffsetX = 0;
    this.locationOffsetY = 0;
    this.displayGrid = new DisplayGrid({
      width, height, cellEdgeLength, zoomSpeed,
    });
    this.gameGrid = [];
    for (let yIndex = 0; yIndex < height / cellEdgeLength; yIndex += 1) {
      this.gameGrid.push(new GameRow({ yIndex, cellCount: width / cellEdgeLength }));
    }
  }

  calculateNextFrame(args) {
    v('mouseXIndex, mouseYIndex', args);
    const { mouseXIndex, mouseYIndex } = args;
    this.getGameGrid().forEach((row) => row.getRow().forEach((cell) => cell.setHasMouse({ hasMouse: false })));
    this.getGameCell({ xIndex: mouseXIndex, yIndex: mouseYIndex }).setHasMouse({ hasMouse: true });
  }

  getDisplayGrid() { return this.displayGrid; }

  getGameCell(args) {
    v('xIndex, yIndex', args);
    const { xIndex, yIndex } = args;
    return this.getGameGrid()[yIndex]?.getCell({ xIndex }) || null;
  }

  getGameGrid() { return this.gameGrid; }

  getLocationOffsetX() { return this.locationOffsetX; }

  getLocationOffsetY() { return this.locationOffsetY; }

  getRedraws() {
    const draws = [];
    for (let yIndex = 0; yIndex < this.getDisplayGrid().getHeight() / this.getDisplayGrid().getCellEdgeLength(); yIndex += 1) {
      for (let xIndex = 0; xIndex < this.getDisplayGrid().getWidth() / this.getDisplayGrid().getCellEdgeLength(); xIndex += 1) {
        const gameCell = this.getGameCell({ xIndex, yIndex });
        const displayCell = this.getDisplayGrid().getDisplayCell({ xIndex, yIndex });
        const tileType = gameCell?.getTileType({ xIndex, yIndex }) || TILE_TYPES.ERROR;
        const drawParameters = displayCell.getRedraw({ tileType });
        if (drawParameters) draws.push(drawParameters);
      }
    }
    return draws;
  }

  setLocationOffsetX(locationOffsetX) { this.locationOffsetX = locationOffsetX; }

  setLocationOffsetY(locationOffsetY) { this.locationOffsetY = locationOffsetY; }

  mouseWheel(args) {
    v('delta', args);
    const { delta } = args;
    this.getDisplayGrid().setZoom({ delta });
  }
}

// P5.js functions
// .______    _____      _______  __    __  .__   __.   ______ .___________. __    ______   .__   __.      _______.
// |   _  \  | ____|    |   ____||  |  |  | |  \ |  |  /      ||           ||  |  /  __  \  |  \ |  |     /       |
// |  |_)  | | |__      |  |__   |  |  |  | |   \|  | |  ,----'`---|  |----`|  | |  |  |  | |   \|  |    |   (----`
// |   ___/  |___ \     |   __|  |  |  |  | |  . `  | |  |         |  |     |  | |  |  |  | |  . `  |     \   \
// |  |       ___) |    |  |     |  `--'  | |  |\   | |  `----.    |  |     |  | |  `--'  | |  |\   | .----)   |
// | _|      |____/     |__|      \______/  |__| \__|  \______|    |__|     |__|  \______/  |__| \__| |_______/

let game = null;
// eslint-disable-next-line no-unused-vars
function setup() {
  const canvas = document.getElementById('defaultCanvas1');
  const width = window.innerWidth;
  const height = window.innerHeight;
  // eslint-disable-next-line no-undef
  createCanvas(width, height, [canvas]);
  game = new Game({
    width, height, cellEdgeLength: 20, zoomSpeed: 0.2,
  });
  // eslint-disable-next-line no-undef
  background(DEFAULT_BACKGROUND_COLOR);
}

// eslint-disable-next-line no-unused-vars
function draw() {
  game.calculateNextFrame({ mouseXIndex: Math.floor(mouseX / game.getDisplayGrid().getCellEdgeLength()), mouseYIndex: Math.floor(mouseY / game.getDisplayGrid().getCellEdgeLength()) });
  const draws = game.getRedraws();
  draws.forEach(({ cellFill, cellRect }) => {
    // eslint-disable-next-line no-undef
    strokeWeight(0.5);
    // eslint-disable-next-line no-undef
    fill(cellFill);
    // eslint-disable-next-line no-undef
    rect(...cellRect);
  });
}

// eslint-disable-next-line no-unused-vars
function mouseWheel(wheelEvent) {
  const delta = -1 * Math.floor(wheelEvent.delta);
  game.mouseWheel({ delta });
}

// TODO: Refactor to build out the display from a single cell that is both vertically and horizontally centered
