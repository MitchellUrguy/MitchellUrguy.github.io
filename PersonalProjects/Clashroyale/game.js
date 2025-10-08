// Minimal lane-battler prototype: lanes, river, elixir bar, cards, towers, spells, simple AI.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Game state
let elixir = 0;
const maxElixir = 10;
const elixirRate = 1 / 1.5; // per second
let selectedCard = null;

const playerUnits = [];
const enemyUnits = [];
const spells = [];
const towers = {
    left: { x: 80, y: H / 2, hp: 1000, team: 'player' },
    right: { x: W - 80, y: H / 2, hp: 1000, team: 'enemy' }
};

const lanes = [H * 0.28, H * 0.5, H * 0.72]; // 3 lanes
const river = { y: H * 0.42, h: H * 0.16 }; // central river area

// Non-infringing, generic card set
const cards = [
    { id: 'foot', name: 'Footman', cost: 3, hp: 140, atk: 25, speed: 50, range: 18, target: 'ground' },
    { id: 'bow', name: 'Bowman', cost: 3, hp: 60, atk: 15, speed: 80, range: 140, target: 'air-ground' },
    { id: 'big', name: 'Brute', cost: 5, hp: 340, atk: 35, speed: 32, range: 18, target: 'ground' },
    { id: 'mage', name: 'Mage', cost: 4, hp: 90, atk: 28, speed: 40, range: 110, target: 'air-ground', splash: true },
    { id: 'bomb', name: 'Bomber', cost: 3, hp: 80, atk: 40, speed: 46, range: 18, target: 'ground', splash: true },
    { id: 'wing', name: 'Winglings', cost: 3, hp: 40, atk: 18, speed: 95, range: 60, target: 'air', count: 3 },
    { id: 'skel', name: 'Skeletons', cost: 2, hp: 28, atk: 10, speed: 80, range: 16, count: 4, target: 'ground' }
];

// Setup UI
function uiSetup() {
    const cardsDiv = document.getElementById('cards');
    for (let c of cards) {
        const btn = document.createElement('button');
        btn.className = 'card';
        btn.innerText = `${c.name} (${c.cost})`;
        btn.onclick = () => {
            selectedCard = c;
            document.querySelectorAll('.card').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
        c.btn = btn;
        cardsDiv.appendChild(btn);
    }
    document.getElementById('spellFire').onclick = () => {
        if (elixir >= 4) {
            selectedCard = null;
            document.querySelectorAll('.card').forEach(b => b.classList.remove('selected'));
            canvas.style.cursor = 'crosshair';
            canvas.onclick = (ev) => {
                const rect = canvas.getBoundingClientRect();
                const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
                // restrict casting to anywhere
                spells.push({ type: 'fire', x, y, t: 0, team: 'player', applied: false });
                elixir -= 4;
                canvas.style.cursor = 'default';
                canvas.onclick = deployHandler;
            };
        }
    };
    document.getElementById('elixirVal').innerText = Math.floor(elixir);
    canvas.onclick = deployHandler;
}

// Deploy logic
function deployHandler(ev) {
    if (!selectedCard) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    if (x > W / 2) return; // player may only deploy left side
    if (elixir < selectedCard.cost) return;
    const laneIdx = nearestLane(y);
    deployUnit(selectedCard, x, laneIdx, 'player');
    elixir -= selectedCard.cost;
    selectedCard = null;
    document.querySelectorAll('.card').forEach(b => b.classList.remove('selected'));
}

function nearestLane(y) {
    let idx = 0, best = 1e9;
    lanes.forEach((ly, i) => {
        const d = Math.abs(y - ly);
        if (d < best) { best = d; idx = i; }
    });
    return idx;
}

function deployUnit(card, x, laneIdx, team) {
    if (card.count && card.count > 1) {
        for (let i = 0; i < card.count; i++) {
            const j = {
                x: x + (team === 'enemy' ? 0 : 0) + (i - Math.floor(card.count / 2)) * 10,
                y: lanes[laneIdx] + (Math.random() - 0.5) * 8,
                hp: card.hp,
                maxHp: card.hp,
                atk: card.atk,
                speed: card.speed,
                range: card.range,
                team,
                splash: !!card.splash,
                target: card.target
            };
            (team === 'player' ? playerUnits : enemyUnits).push(j);
        }
    } else {
        const u = {
            x,
            y: lanes[laneIdx] + (Math.random() - 0.5) * 6,
            hp: card.hp,
            maxHp: card.hp,
            atk: card.atk,
            speed: card.speed,
            range: card.range,
            team,
            splash: !!card.splash,
            target: card.target
        };
        (team === 'player' ? playerUnits : enemyUnits).push(u);
    }
}

// Simple enemy AI - spawns randomly on right
let enemyTimer = 1.5;
function enemyAI(dt) {
    enemyTimer -= dt;
    if (enemyTimer <= 0) {
        enemyTimer = 2 + Math.random() * 2;
        const c = cards[Math.floor(Math.random() * cards.length)];
        const laneIdx = Math.floor(Math.random() * lanes.length);
        deployUnit(c, W - 120, laneIdx, 'enemy');
    }
}

// Game loop
let last = performance.now();
function loop(now) {
    const dt = (now - last) / 1000; last = now;

    // elixir regen
    elixir = Math.min(maxElixir, elixir + elixirRate * dt);
    document.getElementById('elixirVal').innerText = Math.floor(elixir);

    // update buttons enabled state
    for (let c of cards) if (c.btn) c.btn.classList.toggle('disabled', elixir < c.cost);
    document.getElementById('spellFire').classList.toggle('disabled', elixir < 4);

    enemyAI(dt);

    updateUnits(playerUnits, dt);
    updateUnits(enemyUnits, dt);

    for (let s of spells) s.t += dt;
    for (let i = spells.length - 1; i >= 0; i--) if (spells[i].t > 1.2) spells.splice(i, 1);

    resolveSpells();

    draw();

    requestAnimationFrame(loop);
}

function updateUnits(list, dt) {
    for (let u of list) {
        // determine movement direction
        const dir = (u.team === 'player') ? 1 : -1;
        const move = u.speed * dt * dir;

        // find nearest enemy unit or tower
        const enemyList = (u.team === 'player') ? enemyUnits : playerUnits;
        let nearest = null, minD = 1e9;
        for (let e of enemyList) {
            const d = Math.hypot(e.x - u.x, e.y - u.y);
            if (d < minD) { minD = d; nearest = e; }
        }

        let engaged = false;
        if (nearest && minD <= u.range + 6) {
            // attack nearest
            nearest.hp -= u.atk * dt;
            engaged = true;
        } else {
            // check enemy tower in range
            const enemyTower = (u.team === 'player') ? towers.right : towers.left;
            const dTower = Math.hypot(enemyTower.x - u.x, enemyTower.y - u.y);
            if (dTower <= u.range + 20) {
                enemyTower.hp -= u.atk * dt;
                engaged = true;
            }
        }

        if (!engaged) {
            u.x += move;
            // small river slowdown
            if (u.y > river.y && u.y < river.y + river.h) {
                u.x -= dir * (u.speed * 0.15 * dt); // slight slowdown effect
            }
        }
    }

    // remove dead units
    for (let i = list.length - 1; i >= 0; i--) if (list[i].hp <= 0) list.splice(i, 1);

    // check towers
    if (towers.left.hp <= 0 || towers.right.hp <= 0) {
        // simple game over: reset after short message
        setTimeout(() => {
            alert('Game over — reload the page to play again.');
            location.reload();
        }, 50);
        // freeze hp to prevent multiple alerts
        towers.left.hp = towers.left.hp || 0;
        towers.right.hp = towers.right.hp || 0;
    }
}

function resolveSpells() {
    for (let s of spells) {
        if (s.type === 'fire' && s.t > 0.12 && !s.applied) {
            s.applied = true;
            const r = 60;
            [...playerUnits, ...enemyUnits].forEach(u => {
                if (Math.hypot(u.x - s.x, u.y - s.y) < r) u.hp -= 120;
            });
            if (Math.hypot(towers.left.x - s.x, towers.left.y - s.y) < r) towers.left.hp -= 120;
            if (Math.hypot(towers.right.x - s.x, towers.right.y - s.y) < r) towers.right.hp -= 120;
        }
    }
}

// Rendering
function draw() {
    ctx.clearRect(0, 0, W, H);

    // sky / background
    ctx.fillStyle = '#cfefff';
    ctx.fillRect(0, 0, W, H);

    // river
    ctx.fillStyle = '#6fb3d2';
    ctx.fillRect(0, river.y, W, river.h);

    // lanes
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    for (let ly of lanes) {
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(W, ly);
        ctx.stroke();
    }

    // towers
    drawTower(towers.left);
    drawTower(towers.right);

    // units
    drawUnits(playerUnits, 'dodgerblue');
    drawUnits(enemyUnits, 'crimson');

    // spells
    for (let s of spells) {
        if (s.type === 'fire') {
            ctx.beginPath();
            const alpha = Math.max(0, 1 - s.t / 1.2);
            ctx.fillStyle = `rgba(255,120,0,${alpha})`;
            const radius = 20 + 60 * Math.min(1, s.t * 1.5);
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // HUD (elixir drawn in DOM)
}

function drawTower(t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = '#7b4f2f';
    ctx.fillRect(-28, -36, 56, 56);
    ctx.fillStyle = '#222';
    ctx.fillRect(-28, 20, 56, 8);
    // hp bar
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(-30, -48, 60, 6);
    const w = Math.max(0, Math.min(60, (t.hp / 1000) * 60));
    ctx.fillStyle = '#6bff6b';
    ctx.fillRect(-30, -48, w, 6);
    ctx.restore();
}

function drawUnits(list, color) {
    for (let u of list) {
        ctx.save();
        ctx.translate(u.x, u.y);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        // hp bar
        const hpw = Math.max(0, Math.min(24, (u.hp / (u.maxHp || 300)) * 24));
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(-12, -20, 24, 4);
        ctx.fillStyle = '#6bff6b';
        ctx.fillRect(-12, -20, hpw, 4);
        ctx.restore();
    }
}

// initialize
uiSetup();
requestAnimationFrame(loop);