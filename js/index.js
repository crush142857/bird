/**
 * 矩形类，可以移动
 * 属性：宽度、高度、横坐标、纵坐标、横向速度、纵向速度、对应的dom对象
 * xSpeed：横向速度，单位（像素/秒），正数是向右，负数向左
 * ySpeed：纵向速度，单位（像素/秒），正数是向下，负数向上
 */
class Rectangle {
  constructor(width, height, top, left, xSpeed, ySpeed, dom) {
    this.width = width;
    this.height = height;
    this.top = top;
    this.left = left;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.dom = dom;
    this.render();
  }
  render() {
    this.dom.style.width = this.width + "px";
    this.dom.style.height = this.height + "px";
    this.dom.style.top = this.top + "px";
    this.dom.style.left = this.left + "px";
  }
  /**
   * @description:
   * @param {*} duration 单位秒
   * @return {*}
   */
  move(duration) {
    const xDis = this.xSpeed * duration;
    const yDis = this.ySpeed * duration;
    this.left = this.left + xDis;
    this.top = this.top + yDis;
    //判断是否存在onMove方法，如果存在则调用
    if (this.onMove) {
      //每次移动后渲染后，均会使用该方法
      this.onMove();
    }
    this.render(); //重新渲染
  }
}
// 天空运动
const skyDom = document.querySelector(".sky");
//获取属性的计算样式
const skyStyle = getComputedStyle(skyDom);
const skyWidth = parseInt(skyStyle.width);
const skyHeight = parseInt(skyStyle.height);
class Sky extends Rectangle {
  constructor() {
    super(skyWidth, skyHeight, 0, 0, -50, 0, skyDom);
  }
  onMove() {
    if (this.left <= -skyWidth / 2) {
      this.left = 0;
    }
  }
}

// 大地运动
const landDom = document.querySelector(".land");
//获取属性的计算样式
const landStyle = getComputedStyle(landDom);
const landWidth = parseInt(landStyle.width);
const landHeight = parseInt(landStyle.height);
const landTop = parseInt(landStyle.top);
class Land extends Rectangle {
  constructor(speed) {
    super(landWidth, landHeight, landTop, 0, speed, 0, landDom);
  }
  onMove() {
    if (this.left <= -landWidth / 2) {
      this.left = 0;
    }
  }
}

// 小鸟
const birdDom = document.querySelector(".bird");
//获取属性的计算样式
const birdStyle = getComputedStyle(birdDom);
const birdWidth = parseInt(birdStyle.width);
const birdHeight = parseInt(birdStyle.height);
const birdTop = parseInt(birdStyle.top);
const birdLeft = parseInt(birdStyle.left);
const gameDom = document.querySelector(".game");
const gameHeight = gameDom.clientHeight;
class Bird extends Rectangle {
  constructor() {
    super(birdWidth, birdHeight, birdTop, birdLeft, 0, 0, birdDom);
    this.g = 500; //单位像素/毫秒²
    this.maxY = gameHeight - landHeight - this.height;
    this.swingStatus = 1;
    this.timer = null;
    this.render();
  }
  // 开始扇动翅膀
  startSwing() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.swingStatus++;
      if (this.swingStatus === 4) {
        this.swingStatus = 1;
      }
      this.render();
    }, 200);
  }
  //   渲染扇动翅膀
  render() {
    super.render();
    this.dom.className = `bird swing${this.swingStatus}`;
  }
  //   停止扇动翅膀
  stopSwing() {
    clearInterval(this.timer);
    this.timer = null;
  }
  // 移动
  move(duration) {
    super.move(duration);
    this.ySpeed += this.g * duration;
  }
  onMove() {
    if (this.top <= 0) {
      this.top = 0;
    } else if (this.top > this.maxY) {
      this.top = this.maxY;
    }
  }
  jump() {
    this.ySpeed = -200;
  }
}

// 柱子继承自父类属性
const gameWidth = gameDom.clientWidth;
class Pipe extends Rectangle {
  constructor(height, top, speed, dom) {
    super(52, height, top, gameWidth, speed, 0, dom);
  }
  onMove() {
    if (this.left < -this.width) {
      //移除水管对
      this.dom.remove();
    }
  }
}
function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
// 创建产生柱子对
class PipePare {
  constructor(speed) {
    // 上水管
    this.spaceHeight = 150;
    this.minHeight = 80;
    this.maxHeight = landTop - this.minHeight - this.spaceHeight;
    const upHeight = getRandom(this.minHeight, this.maxHeight);
    const upDom = document.createElement("div");
    upDom.className = "pipe up";
    this.upPipe = new Pipe(upHeight, 0, speed, upDom);
    //下水管
    const downHeight = landTop - upHeight - this.spaceHeight;
    const downTop = landTop - downHeight;
    const downDom = document.createElement("div");
    downDom.className = "pipe down";
    this.downPipe = new Pipe(downHeight, downTop, speed, downDom);
    gameDom.appendChild(upDom);
    gameDom.appendChild(downDom);
  }
  //该柱子对是否已经移除了视野,访问器属性
  get useLess() {
    return this.upPipe.left < -this.upPipe.width;
  }
  move(duration) {
    this.upPipe.move(duration);
    this.downPipe.move(duration);
  }
}
// 连续产生柱子对
class PipePareProducer {
  constructor(speed) {
    this.speed = speed;
    this.pairs = [];
    this.timer = null;
  }
  startPrducer() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.pairs.push(new PipePare(this.speed));
      // 移除用不到的柱子
      for (let i = 0; i < this.pairs.length; i++) {
        var pair = this.pairs[i];
        if (pair.useLess) {
          this.pairs.splice(i, 1);
          i--;
        }
      }
    }, 1500);
  }
  stopProduce() {
    clearInterval(this.timer);
    this.timer = null;
  }
}
//游戏行为
class Game {
  constructor() {
    this.sky = new Sky();
    this.land = new Land();
    this.bird = new Bird();
    // 柱子对生成器
    this.pipeProducer = new PipePareProducer(-100);
    this.timer = null;
    this.gameOver = false;
  }
  start() {
    if (this.timer) {
      return;
    }
    if (this.isGameOver()) {
      window.location.reload();
    }
    this.pipeProducer.startPrducer(); //开始生成柱子
    this.bird.startSwing(); //开始煽动翅膀
    this.timer = setInterval(() => {
      const duration = 16 / 1000;
      this.sky.move(duration);
      this.land.move(duration);
      this.bird.move(duration);
      this.pipeProducer.pairs.forEach((pair) => {
        pair.move(duration);
      });
      if (this.isGameOver()) {
        this.stop();
        this.gameOver = true;
      }
    }, 16);
  }

  /**
   *检测小鸟和柱子是否碰撞
   * @description:
   * @param {*} rec1 小鸟
   * @param {*} rec2 柱子
   */
  isHit(rec1, rec2) {
    // 横向:两个矩形中心点的横向距离是否小于矩形宽度之和的一半
    // 纵向:两个矩形中心点的纵向距离是否小于矩形高度之和的一半
    var centerX1 = rec1.left + rec1.width / 2;
    var centerY1 = rec1.top + rec1.height / 2;
    var centerX2 = rec2.left + rec2.width / 2;
    var centerY2 = rec2.top + rec2.height / 2;
    var disX = Math.abs(centerX1 - centerX2);
    var disY = Math.abs(centerY1 - centerY2);
    if (
      disX < (rec1.width + rec2.width) / 2 &&
      disY < (rec1.height + rec2.height) / 2
    ) {
      return true;
    }
    return false;
  }
  // 检测小鸟是否碰到物体
  isGameOver() {
    //检测小鸟是否碰到大地
    if (this.bird.top === this.bird.maxY) {
      return true;
    }
    for (let i = 0; i < this.pipeProducer.pairs.length; i++) {
      const pair = this.pipeProducer.pairs[i];
      if (
        this.isHit(this.bird, pair.upPipe) ||
        this.isHit(this.bird, pair.downPipe)
      ) {
        return true;
      }
    }
    return false;
  }
  stop() {
    clearInterval(this.timer);
    this.timer = null;
    // this.PipePareProducer.stopProduce();
    const active = document.querySelector(".active");
    active.style.display = "block";
    this.pipeProducer.stopProduce();
    this.bird.stopSwing();
  }
  //关联键盘事件
  regEvent() {
    window.onkeydown = (e) => {
      if (e.key == "Enter") {
        if (this.timer) {
          this.stop();
          const active = document.querySelector(".active");
          active.style.display = "none";
        } else {
          this.start();
        }
      }
      if (e.key === " ") {
        this.bird.jump();
      }
    };
  }
}
var g = new Game();
g.regEvent();
console.log(123);
