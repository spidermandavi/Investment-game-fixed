// ===== GAME STATE =====
let players = [];
let currentPlayer = 0;
let turn = 1;
let actionTracker = {};
let gameMode = "turns";
let modeValue = 20;
let stocks = [
  { name: "CDJ", price: 10, volatility: 0.20, owned: {}, totalSpent: {}, desc: "Clothing company, medium risk.", history: [10] },
  { name: "Panda & Co.", price: 10, volatility: 0.12, owned: {}, totalSpent: {}, desc: "Stable bank.", history: [10] },
  { name: "GRAY-BOX", price: 10, volatility: 0.10, owned: {}, totalSpent: {}, desc: "Safe insurance.", history: [10] },
  { name: "BA", price: 10, volatility: 0.40, owned: {}, totalSpent: {}, desc: "Very volatile sports brand.", history: [10] },
  { name: "SEED", price: 10, volatility: 0.25, owned: {}, totalSpent: {}, desc: "Agriculture, event-driven.", history: [10] },
  { name: "EXTRA FRESH", price: 10, volatility: 0.20, owned: {}, totalSpent: {}, desc: "Food, steady growth.", history: [10] }
];
let playerColors = ["#ff4c4c","#4caf50","#2196f3","#ff9800"];
let endTurnDisabled = false;

// ===== GAME FUNCTIONS =====
function startGame() {
  let count = Number(document.getElementById("playerCount").value);
  gameMode = document.getElementById("gameMode").value;
  modeValue = Number(document.getElementById("modeValue").value);

  players = [];
  for (let i = 0; i < count; i++) {
    let nameInput = document.getElementById(`playerName${i}`);
    let name = nameInput && nameInput.value ? nameInput.value : `Player ${i+1}`;
    players.push({ money: 1000, name: name, color: playerColors[i] || "#fff", history: [1000] });
  }

  stocks.forEach(s => {
    s.history = [s.price]; 
    players.forEach((_, i) => { s.owned[i] = 0; s.totalSpent[i] = 0; });
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
function safeEndTurn() {
  if (endTurnDisabled) return;
  endTurnDisabled = true;
  setTimeout(() => { endTurnDisabled = false; }, 1000);
  endTurn();
}

function endTurn() {
  currentPlayer++;
  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    turn++;
    updateMarket();
    applyDividends();
    randomEvent();
    players.forEach((p, i) => {
      let total = p.money;
      stocks.forEach(s => total += s.owned[i]*s.price);
      p.history.push(total);
    });
  }
  resetTurn();
  if (players[currentPlayer].money < 0) forceSell();
  checkWin();
  render();
}

// ===== END GAME WITH CONFIRMATION =====
function confirmEndGame() {
  popupConfirm("Are you sure you want to end the game? All progress will be lost.", () => resetGame());
}

function endGame(force=false){
  if(force){
    let scores = players.map((p,i)=>{
      let total = p.money;
      stocks.forEach(s=> total += s.owned[i] * s.price);
      let earned = total - 1000;
      return { total, earned, name: p.name, color: p.color, history: p.history };
    });
    scores.sort((a,b)=>b.total-a.total);
    showPodium(scores);
  } else {
    resetGame();
  }
}

// ===== RESET =====
function resetGame(){
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');
  players=[]; currentPlayer=0; turn=1; actionTracker={};
}

// ===== POPUP HELPERS =====
function popup(message){
  const popupEl = document.getElementById("popup");
  document.getElementById("popupMessage").innerText = message;
  popupEl.classList.remove("hidden");
  document.getElementById("popupOk").onclick = () => { popupEl.classList.add("hidden"); };
}

function popupConfirm(message, yesCallback){
  const popupEl = document.getElementById("popup");
  document.getElementById("popupMessage").innerText = message;
  popupEl.classList.remove("hidden");

  const okBtn = document.getElementById("popupOk");
  okBtn.innerText = "Yes";
  let cancelBtn = document.getElementById("popupCancel");
  if(!cancelBtn){
    cancelBtn = document.createElement("button");
    cancelBtn.id = "popupCancel";
    cancelBtn.innerText = "No";
    okBtn.parentNode.appendChild(cancelBtn);
  }

  okBtn.onclick = () => { popupEl.classList.add("hidden"); yesCallback(); };
  cancelBtn.onclick = () => { popupEl.classList.add("hidden"); };
}

// ===== Make safeEndTurn globally accessible =====
window.safeEndTurn = safeEndTurn;
