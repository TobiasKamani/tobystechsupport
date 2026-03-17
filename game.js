// ── BUG ZAPPER MINI GAME ──
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreVal');
const bestEl = document.getElementById('bestVal');

const W = canvas.width, H = canvas.height;
let bugs = [], score = 0, best = 0, running = false, gameOver = false;
let spawnTimer = 0, spawnRate = 90, lives = 3;
let animId = null;

const ROUTER = { x: W - 52, y: H / 2, w: 36, h: 36 };

function randomBug() {
  const types = ['🐛','🦟','🐜','🪲','🦗'];
  const size = 22 + Math.random() * 10;
  const speed = 0.9 + Math.random() * 1.2 + score * 0.012;
  return {
    x: -size,
    y: 24 + Math.random() * (H - 56),
    size,
    speed,
    emoji: types[Math.floor(Math.random() * types.length)],
    alive: true,
    wobble: Math.random() * Math.PI * 2,
    squish: 1,
    pop: 0
  };
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#0f0f1f');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(240,165,0,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(240,165,0,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(ROUTER.x - 10, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawRouter() {
  ctx.font = '32px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (lives === 1) {
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 18;
  }
  ctx.fillText('📶', ROUTER.x + ROUTER.w / 2, ROUTER.y - 4);
  ctx.shadowBlur = 0;

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(ROUTER.x + 4 + i * 13, ROUTER.y + 20, 4, 0, Math.PI * 2);
    ctx.fillStyle = i < lives ? '#50c878' : 'rgba(255,255,255,0.18)';
    ctx.fill();
  }
}

function drawBug(b) {
  ctx.save();
  const wy = b.y + Math.sin(b.wobble) * 5;
  ctx.translate(b.x, wy);
  if (b.pop > 0) {
    ctx.globalAlpha = b.pop / 8;
    ctx.font = `${b.size * 2 * (1 - b.pop / 8)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💥', 0, 0);
  } else {
    ctx.font = `${b.size * b.squish}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.emoji, 0, 0);
  }
  ctx.restore();
}

function drawOverlay(line1, line2) {
  ctx.fillStyle = 'rgba(8,8,20,0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f0a500';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line1, W / 2, H / 2 - 14);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '13px sans-serif';
  ctx.fillText(line2, W / 2, H / 2 + 14);
}

function tick() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  if (!running) {
    drawRouter();
    if (gameOver) {
      drawOverlay('Game Over! Score: ' + score, 'Click the canvas to play again');
    } else {
      drawOverlay('🐛 Bug Zapper!', 'Click the canvas or press Space to start');
    }
    animId = requestAnimationFrame(tick);
    return;
  }

  // spawn
  spawnTimer++;
  if (spawnTimer >= spawnRate) {
    bugs.push(randomBug());
    spawnTimer = 0;
    spawnRate = Math.max(28, spawnRate - 0.4);
  }

  // update & draw bugs
  const toRemove = [];
  bugs.forEach((b, i) => {
    if (b.pop > 0) {
      b.pop--;
      drawBug(b);
      if (b.pop === 0) toRemove.push(i);
      return;
    }
    b.wobble += 0.08;
    b.x += b.speed;
    if (b.squish > 1) b.squish = Math.max(1, b.squish - 0.06);

    if (b.alive && b.x >= ROUTER.x) {
      b.alive = false;
      b.pop = 8;
      lives--;
      if (lives <= 0) {
        running = false;
        gameOver = true;
        if (score > best) { best = score; bestEl.textContent = best; }
      }
    }
    drawBug(b);
  });

  // clean up dead pops in reverse
  for (let i = toRemove.length - 1; i >= 0; i--) bugs.splice(toRemove[i], 1);
  // remove off-screen
  bugs = bugs.filter(b => b.x < W + 50);

  drawRouter();
  animId = requestAnimationFrame(tick);
}

function hitTest(cx, cy) {
  if (!running) { startGame(); return; }
  for (let i = bugs.length - 1; i >= 0; i--) {
    const b = bugs[i];
    if (!b.alive || b.pop > 0) continue;
    const wy = b.y + Math.sin(b.wobble) * 5;
    const dx = b.x - cx, dy = wy - cy;
    if (Math.sqrt(dx * dx + dy * dy) < b.size * 0.9) {
      b.alive = false;
      b.pop = 8;
      b.squish = 1.5;
      score++;
      scoreEl.textContent = score;
      spawnRate = Math.max(28, 90 - score * 1.8);
      break;
    }
  }
}

function startGame() {
  bugs = [];
  score = 0;
  lives = 3;
  spawnTimer = 0;
  spawnRate = 90;
  gameOver = false;
  running = true;
  scoreEl.textContent = 0;
}

canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  const scaleX = W / r.width;
  const scaleY = H / r.height;
  hitTest((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const scaleX = W / r.width;
  const scaleY = H / r.height;
  const t = e.touches[0];
  hitTest((t.clientX - r.left) * scaleX, (t.clientY - r.top) * scaleY);
}, { passive: false });

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!running) startGame();
  }
});

// kick off
tick();
