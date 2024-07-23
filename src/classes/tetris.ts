export class Tetris {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private COLORS = [
    "black",
    "orange",
    "blue",
    "yellow",
    "cyan",
    "red",
    "green",
    "magenta",
  ];

  private PIECES = [
    {
      name: "L",
      color: 1,
      schema: [
        [1, 1, 1],
        [1, 0, 0],
      ],
    },
    {
      name: "J",
      color: 2,
      schema: [
        [1, 1, 1],
        [0, 0, 1],
      ],
    },
    {
      name: "O",
      color: 3,
      schema: [
        [1, 1],
        [1, 1],
      ],
    },
    {
      name: "I",
      color: 4,
      schema: [[1, 1, 1, 1]],
    },
    {
      name: "Z",
      color: 5,
      schema: [
        [0, 1, 1],
        [1, 1, 0],
      ],
    },
    {
      name: "S",
      color: 6,
      schema: [
        [1, 1, 0],
        [0, 1, 1],
      ],
    },
    {
      name: "T",
      color: 7,
      schema: [
        [0, 1, 0],
        [1, 1, 1],
      ],
    },
  ];

  private readonly WIDTH = 10;
  private readonly HEIGHT = 20;
  private readonly BLOCK_SIZE = 32;
  private readonly NEXT_BLOCKS = 4;

  private landed = [];
  private currentX = 0;
  private currentY = 0;
  private currentBlockIndex;
  private nextBlockIndexes = [];
  private currentSchema;
  private timeBefore = 0;
  private timeAfter = 0;
  private stoper = 0;
  private score = 0;

  public constructor(selector : string) {
    this.canvas = document.querySelector(selector) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');

    this.run = this.run.bind(this);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.drawBlock = this.drawBlock.bind(this);
    this.onPressKeyboard = this.onPressKeyboard.bind(this);
    this.getNewBlock = this.getNewBlock.bind(this);
    this.checkCollision = this.checkCollision.bind(this);
    this.checkLines = this.checkLines.bind(this);
  }

  public run() {
    window.addEventListener('keydown', this.onPressKeyboard, false);

    this.landed = Tetris.getNewArray(this.WIDTH, this.HEIGHT);
    this.getNewBlock();
    this.update();
  }

  private update() {
    this.timeBefore = performance.now();
    this.stoper += this.timeBefore - this.timeAfter;

    if (this.stoper > 500) {
      this.currentY += 1;
      this.stoper = 0;
    }

    if (this.checkCollision(this.currentSchema, 0, 0)) {
      this.setSolid();
      this.getNewBlock();
    }

    this.checkLines();

    this.render();
    requestAnimationFrame(this.update);
    this.timeAfter = performance.now();
  }

  private render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000b1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        ctx.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE)
        this.drawBlock(
          x * this.BLOCK_SIZE,
          y * this.BLOCK_SIZE,
          this.COLORS[this.landed[y][x]]
        )
      }
    }

    for (let y = 0; y < this.currentSchema.length; y++) {
      for (let x = 0; x < this.currentSchema[y].length; x++) {
        if (this.currentSchema[y][x] === 1) {
          this.drawBlock(
            (x + this.currentX) * this.BLOCK_SIZE,
            (y + this.currentY) * this.BLOCK_SIZE,
            this.COLORS[this.PIECES[this.currentBlockIndex].color]
          )
        }
      }
    }

    for (let i = 0; i < this.nextBlockIndexes.length; i++) {
      for (let y = 0; y < this.PIECES[this.nextBlockIndexes[i]].schema.length; y++) {
        for (let x = 0; x < this.PIECES[this.nextBlockIndexes[i]].schema[y].length; x++) {
          if (this.PIECES[this.nextBlockIndexes[i]].schema[y][x] === 1) {
            this.drawBlock(
              (x + this.WIDTH) * this.BLOCK_SIZE + 32,
              y * this.BLOCK_SIZE + ((i + 1) * 128),
              this.COLORS[this.PIECES[this.nextBlockIndexes[i]].color]
            )
          }
        }
      }
    }

    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${this.score}`, (this.WIDTH + 1) * this.BLOCK_SIZE, 64);

    ctx.font = '16px sans-serif';
    ctx.fillText(`Next blocks`, (this.WIDTH + 1) * this.BLOCK_SIZE, 90);
  }

  private drawBlock(x : number, y : number, color : string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x,
      y,
      this.BLOCK_SIZE,
      this.BLOCK_SIZE
    )
  }

  private checkCollision(schema : Array<Array<number>>, offsetX : number, offsetY : number) : boolean {
    for (let y = 0; y < schema.length; y++) {
      for (let x = 0; x < schema[y].length; x++) {
        const pieceY = y + this.currentY + offsetY;
        const pieceX = x + this.currentX + offsetX;

        if (schema[y][x] !== 0 && pieceY > 0
          && (pieceY >= this.HEIGHT
            || pieceX < 0
            || pieceX > this.WIDTH
            || this.landed[pieceY][pieceX] !== 0)) {
          return true;
        }
      }
    }

    return false;
  }

  private setSolid() {
    for (let y = 0; y < this.currentSchema.length; y++) {
      for (let x = 0; x < this.currentSchema[y].length; x++) {
        if (this.currentSchema[y][x] === 1) {
          this.landed[y + this.currentY - 1][x + this.currentX] = this.PIECES[this.currentBlockIndex].color;
        }
      }
    }
  }

  private onPressKeyboard(event) {
    switch (event.code) {
      case 'ArrowUp':
        const newSchema = Tetris.rotateClockwise(this.currentSchema);
        if (!this.checkCollision(newSchema, 0, 0)
          && !this.checkCollision(newSchema, 0, 1)
        ) {
          this.currentSchema = newSchema;
        }
        break;
      case 'ArrowLeft':
        if (!this.checkCollision(this.currentSchema, -1, 0)) {
          this.currentX -= 1;
        }
        break;
      case 'ArrowRight':
        if (!this.checkCollision(this.currentSchema, 1, 0)) {
          this.currentX += 1;
        }
        break;
      case 'ArrowDown':
        if (!this.checkCollision(this.currentSchema, 0, 1)) {
          this.currentY += 1;
          this.stoper = 0;
        }
        break;
      case 'Space':
        while (!this.checkCollision(this.currentSchema, 0, 1)) {
          this.currentY += 1;
          this.stoper = 0;
        }
        break;
    }
  }

  private getNewBlock() {
    if (this.nextBlockIndexes.length === 0) {
      for(let i = 0; i < this.NEXT_BLOCKS; i++) {
        this.nextBlockIndexes.push(Math.floor(Math.random() * (this.PIECES.length - 0.5)));
      }
    }
    this.currentBlockIndex = this.nextBlockIndexes[0];
    this.currentSchema = Tetris.copy(this.PIECES[this.currentBlockIndex].schema);
    this.nextBlockIndexes.shift();
    this.nextBlockIndexes.push(Math.floor(Math.random() * (this.PIECES.length - 0.5)));

    for (let i = 0; i < Math.random() * 4; i++) {
      this.currentSchema = Tetris.rotateClockwise(this.currentSchema);
    }

    this.currentY = -this.currentSchema.length + 1;
    this.currentX = Math.floor((this.WIDTH / 2) - (this.currentSchema[0].length / 2));
  }

  private static getNewArray(width : number, height : number) : Array<Array<number>>{
    let newArray = [];
    for (let y = 0; y < height; y++) {
      newArray.push([]);
      for(let x = 0; x < width; x++) {
        newArray[y].push(0);
      }
    }

    return newArray;
  }

  private static copy(arr : Array<Array<number>>) : Array<Array<number>> {
    return JSON.parse(JSON.stringify(arr));
  }

  private static rotateClockwise(arr : Array<Array<number>>) : Array<Array<number>> {
    let transformedArray = [];

    const M = arr.length;
    const N = arr[0].length;

    for (let y = 0; y < N; y++) {
      transformedArray.push([]);
      for (let x = 0; x < M; x++) {
        transformedArray[y].push([]);
      }
    }

    for (let y = 0; y < M; y++) {
      for (let x = 0; x < N; x++) {
        transformedArray[x][M - 1 - y] = arr[y][x];
      }
    }

    return transformedArray;
  }

  private checkLines() {
    let linesToShift = [];
    for (let y = this.HEIGHT - 1; y > 0; y--) {
      let blocksInRow = 0;
      for (let x = 0; x < this.WIDTH; x++) {
        if (this.landed[y][x] !== 0) {
          blocksInRow++;
        }
      }
      if (blocksInRow === this.WIDTH) {
        linesToShift.push(y);
      }
    }

    switch (linesToShift.length) {
      case 0:
        break;
      case 1:
        this.score += 100;
        break;
      case 2:
        this.score += 300;
        break;
      case 3:
        this.score += 500;
        break;
      case 4:
        this.score += 800;
        break;
      default:
        this.score += 800 + ( 400 * linesToShift.length)
        break;
    }

    for (const line of linesToShift) {
      this.shiftLines(line);
    }
  }

  private shiftLines(line : number) {
    for (let y = line; y > 0; y--) {
      if (line === 0) {
        this.landed[y][0] = 0;
      }
      for (let x = 0; x < this.WIDTH; x++) {
        this.landed[y][x] = this.landed[y-1][x];
      }
    }
  }
}
