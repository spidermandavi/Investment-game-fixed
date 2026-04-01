// ===== GAME LOGIC =====

// Game state
let players = [];
let stocks = [];
let currentPlayer = 0;
let turn = 1;
let maxTurns = 20;

// ===== Initialize Game =====
function initGame(playerNames, stockList) {
  // Players
  players = playerNames.map((name, i) => ({
    name,
    money: 1000,
    color: getRandomColor(),
    history: [1000],
  }));

  // Stocks
  stocks = stockList.map(s => ({
    name: s.name,
    price: s.price,
    change: 0,
    desc: s.desc,
    history: [s.price],
    owned: Array(players.length).fill(0),
    totalSpent: Array(players.length).fill(0),
  }));

  currentPlayer = 0;
  turn = 1;

  // Initial UI render
  render();
}

// ===== Random Color Helper =====
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}

// ===== Buy Stock =====
function buy(stockIndex, amount) {
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];

  const totalCost = stock.price * amount;
  if (player.money >= totalCost) {
    player.money -= totalCost;
    stock.owned[currentPlayer] += amount;
    stock.totalSpent[currentPlayer] += totalCost;
    popup(`${player.name} bought ${amount} shares of ${stock.name} for $${totalCost.toFixed(2)}`);
    updateHistory(stockIndex);
  } else {
    popup("Not enough money to buy this amount.");
  }
}

// ===== Sell Stock =====
function sell(stockIndex, amount) {
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];

  if (stock.owned[currentPlayer] >= amount) {
    const totalGain = stock.price * amount;
    player.money += totalGain;
    stock.owned[currentPlayer] -= amount;
    stock.totalSpent[currentPlayer] -= (stock.totalSpent[currentPlayer]/(stock.owned[currentPlayer]+amount))*amount;
    popup(`${player.name} sold ${amount} shares of ${stock.name} for $${totalGain.toFixed(2)}`);
    updateHistory(stockIndex);
  } else {
    popup("You don't own enough shares to sell this amount.");
  }
}

// ===== Update Stock History =====
function updateHistory(stockIndex) {
  const stock = stocks[stockIndex];
  stock.history.push(stock.price);
  players.forEach((p, i) => {
    const worth = p.money + stocks.reduce((sum, s) => sum + s.owned[i]*s.price, 0);
    p.history.push(worth);
  });
}

// ===== Random Stock Price Changes =====
function randomStockChanges() {
  stocks.forEach(stock => {
    const change = (Math.random() - 0.5) * 10; // ±5 range
    stock.change = change;
    stock.price = Math.max(1, stock.price + change);
  });
}

// ===== Next Turn =====
function nextTurn() {
  randomStockChanges();
  currentPlayer = (currentPlayer + 1) % players.length;
  if (currentPlayer === 0) turn++;
  render();

  if (turn > maxTurns) endGame();
}

// ===== End Game =====
function endGame() {
  const scores = players.map((p, i) => ({
    name: p.name,
    earned: p.money + stocks.reduce((sum, s) => sum + s.owned[i]*s.price, 0) - 1000,
    total: p.money + stocks.reduce((sum, s) => sum + s.owned[i]*s.price, 0)
  }))
  .sort((a,b)=>b.total - a.total);

  showPodium(scores);
}

// ===== Reset Game =====
function resetGame() {
  players = [];
  stocks = [];
  currentPlayer = 0;
  turn = 1;
  render();
}

// ===== Quick Testing =====
// Example stocks and players
// initGame(["Alice","Bob"], [
//   {name:"TechCo", price:50, desc:"A tech company"},
//   {name:"FoodInc", price:30, desc:"Food industry stock"},
//   {name:"AutoLtd", price:70, desc:"Automobile manufacturer"},
// ]);
