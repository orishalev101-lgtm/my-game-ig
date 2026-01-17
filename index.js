(() => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  document.body.style.margin = "0"
  document.body.style.overflow = "hidden"
  document.body.style.background = "#0b0f1a"
  document.body.appendChild(canvas)

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener("resize", resize)
  resize()

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const rand = (a, b) => a + Math.random() * (b - a)
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by)

  const keys = new Set()
  window.addEventListener("keydown", e => keys.add(e.code))
  window.addEventListener("keyup", e => keys.delete(e.code))

  let mouse = { x: 0, y: 0, down: false }
  window.addEventListener("pointermove", e => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  })
  window.addEventListener("pointerdown", () => mouse.down = true)
  window.addEventListener("pointerup", () => mouse.down = false)

  let player, bullets, enemies, score, lastShot, gameOver
  const button = { x: 0, y: 0, w: 220, h: 60 }

  function resetGame() {
    player = { x: canvas.width / 2, y: canvas.height / 2, r: 18, speed: 670, hp: 1 }
    bullets = []
    enemies = []
    score = 0
    lastShot = 0
    gameOver = false
  }

  resetGame()

  function shoot(x, y) {
    const now = performance.now() / 1000
    if (now - lastShot < 0.15) return
    lastShot = now
    const a = Math.atan2(y - player.y, x - player.x)
    bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * 800,
      vy: Math.sin(a) * 800,
      r: 4,
      life: 1
    })
  }

  function spawnEnemy() {
    const side = Math.floor(rand(0, 4))
    let x, y
    if (side === 0) { x = rand(0, canvas.width); y = -40 }
    if (side === 1) { x = canvas.width + 40; y = rand(0, canvas.height) }
    if (side === 2) { x = rand(0, canvas.width); y = canvas.height + 40 }
    if (side === 3) { x = -40; y = rand(0, canvas.height) }

    enemies.push({
      x, y,
      r: rand(15, 30),
      speed: rand(80, 140),
    })
  }

  let spawnTimer = 0

  function update(dt) {
    if (gameOver) return

    let dx = 0, dy = 0
    if (keys.has("KeyW") || keys.has("ArrowUp")) dy--
    if (keys.has("KeyS") || keys.has("ArrowDown")) dy++
    if (keys.has("KeyA") || keys.has("ArrowLeft")) dx--
    if (keys.has("KeyD") || keys.has("ArrowRight")) dx++

    const len = Math.hypot(dx, dy) || 1
    player.x += (dx / len) * player.speed * dt
    player.y += (dy / len) * player.speed * dt

    player.x = clamp(player.x, player.r, canvas.width - player.r)
    player.y = clamp(player.y, player.r, canvas.height - player.r)

    if (keys.has("Space") || mouse.down) shoot(mouse.x, mouse.y)

    spawnTimer -= dt
    if (spawnTimer <= 0) {
      spawnTimer = 0.8
      spawnEnemy()
    }

    bullets.forEach(b => {
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt
    })
    bullets = bullets.filter(b => b.life > 0)

    enemies.forEach(e => {
      const a = Math.atan2(player.y - e.y, player.x - e.x)
      e.x += Math.cos(a) * e.speed * dt
      e.y += Math.sin(a) * e.speed * dt
      if (dist(e.x, e.y, player.x, player.y) < e.r + player.r) {
        player.hp--
        e.x += Math.cos(a) * 40
        e.y += Math.sin(a) * 40
        if (player.hp <= 0) gameOver = true
      }
    })

    bullets.forEach(b => {
      enemies.forEach(e => {
        if (dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
          e.hit = true
          b.life = 0
          score += 10
        }
      })
    })

    enemies = enemies.filter(e => !e.hit)
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#4cc9f0"
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#ffffff"
    bullets.forEach(b => {
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = "#ff4d6d"
    enemies.forEach(e => {
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = "#fff"
    ctx.font = "26px Arial"
    ctx.fillText("SCORE: " + score, 20, 40)
    ctx.fillText("HP: " + player.hp, 20, 75)

    if (gameOver) {
      ctx.font = "52px Arial"
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 80)

      button.x = canvas.width / 2 - button.w / 2
      button.y = canvas.height / 2 - 20

      ctx.fillStyle = "#4cc9f0"
      ctx.fillRect(button.x, button.y, button.w, button.h)

      ctx.fillStyle = "#000000"
      ctx.font = "28px Arial"
      ctx.fillText("PLAY AGAIN", canvas.width / 2, button.y + 38)
      ctx.textAlign = "left"
    }
  }

  canvas.addEventListener("click", e => {
    if (!gameOver) return
    const mx = e.clientX
    const my = e.clientY
    if (
      mx > button.x &&
      mx < button.x + button.w &&
      my > button.y &&
      my < button.y + button.h
    ) {
      resetGame()
    }
  })

  let last = performance.now()
  function loop(now) {
    const dt = (now - last) / 1000
    last = now
    update(dt)
    render()
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
})()
