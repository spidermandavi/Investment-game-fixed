// ===== GAME LOGIC =====
let players = [];
let stocks = [];
let currentPlayer = 0;
let turn = 1;

function startGame() {
  const count = Number(document.getElementById("playerCount").value);
  players = [];
  for (let i = 0; i < count; i++) {
    const nameInput = document.getElementById(`playerName${i}`);
    players.push({
      name: nameInput.value || `Player ${i+1}`,
      money: 1000,
      color: `hsl(${Math.random()*360},60%,60%)`,
      history: [1000]
    });
  }

  // Initialize example stocks
  stocks = [
    { name: "TechCorp", price: 100, change: 0, owned: Array(count).fill(0), totalSpent: Array(count).fill(0), history: [100], desc:"A high-tech company." },
    { name: "GreenEnergy", price: 80, change:0, owned: Array(count).fill(0), totalSpent: Array(count).fill(0), history:[80], desc:"Eco-friendly energy stock." },
    { name: "AutoMotive", price: 120, change:0, owned: Array(count).fill(0), totalSpent: Array(count).fill(0), history:[120], desc:"Car manufacturing giant." }
  ];

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  render();
}

function safeEndTurn() {
  currentPlayer = (currentPlayer + 1) % players.length;
  turn++;
  render();
}

function confirmEndGame() {
  popupConfirm("Are you sure you want to end the game?", () => {
    const scores = players.map(p=>{
      let total = p.money;
      stocks.forEach(s=>total += s.owned[players.indexOf(p)]*s.price);
      return {name: p.name, total: total, earned: total - 1000};
    }).sort((a,b)=>b.total - a.total);
    showPodium(scores);
  });
}

// ===== BUY/SELL =====
function buy(stockIndex, amount) {
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];
  const cost = stock.price * amount;

  if (player.money >= cost) {
    player.money -= cost;
    stock.owned[currentPlayer] += amount;
    stock.totalSpent[currentPlayer] += cost;
    player.history.push(player.money + stocks.reduce((sum,s,i)=>sum+s.owned[i]*s.price,0));
  } else {
    popup("Not enough money to buy this amount.");
  }
}

function sell(stockIndex, amount) {
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];
  if (stock.owned[currentPlayer] >= amount) {
    stock.owned[currentPlayer] -= amount;
    const gain = stock.price * amount;
    player.money += gain;
    stock.totalSpent[currentPlayer] = Math.max(0, stock.totalSpent[currentPlayer] - (stock.price*amount));
    player.history.push(player.money + stocks.reduce((sum,s,i)=>sum+s.owned[i]*s.price,0));
  } else {
    popup("You don't own enough shares to sell this amount.");
  }
}
