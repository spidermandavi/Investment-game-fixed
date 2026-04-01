// ===== GAME STATE =====
let players = [];
let currentPlayer = 0;
let turn = 1;
let actionTracker = {};

let gameMode = "turns";
let modeValue = 20;

let endTurnLocked = false; // 🔒 prevents double clicking

let stocks = [
  { name: "CDJ", price: 10, volatility: 0.20, owned: {}, totalSpent: {}, desc: "Clothing company, medium risk.", history: [10] },
  { name: "Panda & Co.", price: 10, volatility: 0.12, owned: {}, totalSpent: {}, desc: "Stable bank.", history: [10] },
  { name: "GRAY-BOX", price: 10, volatility: 0.10, owned: {}, totalSpent: {}, desc: "Safe insurance.", history: [10] },
  { name: "BA", price: 10, volatility: 0.40, owned: {}, totalSpent: {}, desc: "Very volatile sports brand.", history: [10] },
  { name: "SEED", price: 10, volatility: 0.25, owned: {}, totalSpent: {}, desc: "Agriculture, event-driven.", history: [10] },
  { name: "EXTRA FRESH", price: 10, volatility: 0.20, owned: {}, totalSpent: {}, desc: "Food, steady growth.", history: [10] }
];

let playerColors = ["#ff4c4c","#4caf50","#2196f3","#ff9800"];

// ===== GAME FUNCTIONS =====
function startGame() {
  let count = Number(document.getElementById("playerCount").value);
  gameMode = document.getElementById("gameMode").value;
  modeValue = Number(document.getElementById("modeValue").value);

  players = [];

  for (let i = 0; i < count; i++) {
    let nameInput = document.getElementById(`playerName${i}`);
    let name = nameInput && nameInput.value ? nameInput.value : `Player ${i+1}`;

    players.push({ 
      money: 1000, 
      name: name, 
      color: playerColors[i] || "#fff",
      history: [1000]
    });
  }

  stocks.forEach(s => {
    s.history = [s.price];
    players.forEach((_, i) => {
      s.owned[i] = 0;
      s.totalSpent[i] = 0;
    });
  });

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  currentPlayer = 0;
  turn = 1;
  resetTurn();
  render();
}

function resetTurn() { actionTracker = {}; }

// ===== BUY / SELL =====
function buy(i, amount) {
  if (actionTracker[i] === "sell") return popup("You cannot buy and sell the same stock in one turn!");
  let s = stocks[i];
  let cost = s.price * amount;
  if (players[currentPlayer].money < cost) return popup("Not enough money");

  players[currentPlayer].money -= cost;
  s.owned[currentPlayer] += amount;
  s.totalSpent[currentPlayer] += cost;

  actionTracker[i] = "buy";

  let total = players[currentPlayer].money;
  stocks.forEach(s => total += s.owned[currentPlayer]*s.price);
  players[currentPlayer].history.push(total);

  render();
}

function sell(i) {
  if (actionTracker[i] === "buy") return popup("You cannot buy and sell the same stock in one turn!");
  let s = stocks[i];
  if (s.owned[currentPlayer] <= 0) return popup("No stocks to sell");

  s.owned[currentPlayer]--;
  players[currentPlayer].money += s.price;
  let avg = s.totalSpent[currentPlayer] / (s.owned[currentPlayer] + 1);
  s.totalSpent[currentPlayer] -= avg;

  actionTracker[i] = "sell";

  let total = players[currentPlayer].money;
  stocks.forEach(s => total += s.owned[currentPlayer]*s.price);
  players[currentPlayer].history.push(total);

  render();
}

// ===== TURN SYSTEM =====
function endTurn() {
  if (endTurnLocked) return; // 🚫 prevent spam
  endTurnLocked = true;

  // optional UI disable (only works if button has this ID)
  const btn = document.getElementById("endTurnBtn");
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
  }

  setTimeout(() => {
    endTurnLocked = false;
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  }, 1000);

  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    turn++;

    updateMarket();
    applyDividends();
    randomEvent();

    players.forEach((p, i) => {
      let total = p.money;
      stocks.forEach(s => total += s.owned[i] * s.price);
      p.history.push(total);
    });
  }

  resetTurn();

  if (players[currentPlayer].money < 0) forceSell();

  checkWin();
  render();
}

// ===== MARKET =====
function updateMarket() {
  stocks.forEach(s => {
    let change = (Math.random()*2-1)*s.volatility*s.price;
    s.price += change;
    s.price = Math.max(1, Math.min(500, s.price));
    s.change = change ?? 0;
    s.history.push(s.price);
  });
}

// ===== DIVIDENDS =====
function applyDividends() {
  players.forEach((p, pi)=>{
    stocks.forEach(s=>{
      let owned = s.owned[pi];
      let value = owned*s.price;

      let rate=0;
      if(owned>=2000) rate=0.2;
      else if(owned>=1000) rate=0.1;
      else if(owned>=500) rate=0.075;
      else if(owned>=100) rate=0.05;
      else if(owned>=50) rate=0.025;
      else if(owned>10) rate=0.005;

      p.money += value*rate;
    });
  });
}

// ===== EVENTS =====
function flashPlayer(index, color = "#ffff00", duration = 800){
  const playerEl = document.getElementById(`player${index}`);
  if(!playerEl) return;
  const originalBg = playerEl.style.backgroundColor;
  playerEl.style.backgroundColor = color;
  setTimeout(() => playerEl.style.backgroundColor = originalBg || "", duration);
}

function randomEvent(){
  if(turn < 10) return;            
  if(Math.random() > 0.2) return;

  let events = [
    {text:"Crashed car", value:-300, weight:1},
    {text:"Gift", value:200, weight:3},
    {text:"Repairs", value:-100, weight:2},
    {text:"Clothes", value:-50, weight:4},
    {text:"Phone broken", value:-240, weight:2},
    {text:"Birthday", value:75, weight:3},
    {text:"Furniture", value:-300, weight:1},
    {text:"Flowers", value:-20, weight:5},
    {text:"Tax return", value:150, weight:3}
  ];

  let weightedEvents = [];
  events.forEach(e => { for(let w=0; w<e.weight; w++) weightedEvents.push(e); });

  let i = Math.floor(Math.random() * players.length);
  let player = players[i];
  let e = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];

  player.money += e.value;

  flashPlayer(i, e.value >= 0 ? "#4caf50" : "#ff4c4c", 1000);
  popup(`Event for ${player.name}: ${e.text}<br>${e.value >= 0 ? "+" : ""}$${e.value}`);
}

// ===== WIN SYSTEM =====
function checkWin(){
  if(gameMode==="turns" && turn>modeValue) return endGame(true);
  if(gameMode==="money" && players.some(p=>p.money>=modeValue)) return endGame(true);
}

function endGame(force = false) {
  if (force) {
    let scores = players.map((p,i)=>{
      let total = p.money;
      stocks.forEach(s=> total += s.owned[i] * s.price);
      let earned = total - 1000;
      return { total, earned, name: p.name, color: p.color, history: p.history };
    });

    scores.sort((a,b)=>b.total-a.total);
    showPodium(scores);

  } else {
    popup(`
      <h2>End Game?</h2>
      <p>Are you sure you want to end the game?<br>All progress will be lost.</p>
      <button onclick="confirmEndGame()">Yes, End Game</button>
      <button onclick="closePopup()">Cancel</button>
    `);
  }
}

// ===== CONFIRMATION HELPERS =====
function confirmEndGame() {
  closePopup();
  resetGame();
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

// ===== RESET =====
function resetGame(){
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');
  players=[]; currentPlayer=0; turn=1; actionTracker={};
}
