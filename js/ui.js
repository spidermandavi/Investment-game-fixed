// ===== UI =====

// Close popup
document.getElementById("popupOk").onclick = () => {
  document.getElementById("popup").classList.add("hidden");
};

// Popup function (supports HTML + optional graph)
function popup(html) {
  const popupEl = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");

  popupContent.innerHTML = html + '<canvas id="graphCanvas"></canvas><button id="popupOk">OK</button>';

  popupEl.classList.remove("hidden");

  document.getElementById("popupOk").onclick = () => {
    popupEl.classList.add("hidden");
  };
}

// ===== GRAPH DRAWER =====
function drawGraph(data, color = "#4caf50") {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas || !data || data.length < 2) return;

  const ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const padding = 40;
  const w = canvas.clientWidth - padding * 2;
  const h = canvas.clientHeight - padding * 2;

  let max = Math.max(...data);
  let min = Math.min(...data);
  if (max === min) { max += 1; min -= 1; }

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;

  // Y axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + h);
  ctx.stroke();

  // X axis
  ctx.beginPath();
  ctx.moveTo(padding, padding + h);
  ctx.lineTo(padding + w, padding + h);
  ctx.stroke();

  // Y labels
  ctx.fillStyle = "#aaa";
  ctx.font = "12px Arial";

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const value = min + (i / steps) * (max - min);
    const y = padding + h - (i / steps) * h;

    ctx.fillText(value.toFixed(0), 2, y + 3);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + w, y);
    ctx.stroke();
  }

  // Animated line
  let progress = 0;
  function animate() {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxIndex = Math.floor(progress * (data.length - 1));
    for (let i = 0; i <= maxIndex; i++) {
      const x = padding + (i / (data.length - 1)) * w;
      const y = padding + h - ((data[i] - min) / (max - min)) * h;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    progress += 0.04;
    if (progress <= 1) requestAnimationFrame(animate);
  }

  animate();
}

// ===== Player Input Generator =====
document.getElementById("playerCount").addEventListener("change", () => {
  const count = Number(document.getElementById("playerCount").value);
  const container = document.getElementById("playerNamesContainer");
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.innerHTML = `<label>Player ${i + 1} Name: 
      <input id="playerName${i}" placeholder="Player ${i + 1}" />
    </label>`;
    container.appendChild(div);
  }
});

// ===== Unified Buy/Sell Mode Toggle =====
let tradeMode = "buy";

function setTradeMode(mode) {
  tradeMode = mode;
  const toggleContainer = document.getElementById("buySellToggle");
  if (!toggleContainer) return;

  toggleContainer.innerHTML = `
    <button class="${mode === 'buy' ? 'active' : 'inactive'}" onclick="setTradeMode('buy')">BUY</button>
    <button class="${mode === 'sell' ? 'active' : 'inactive'}" onclick="setTradeMode('sell')">SELL</button>
  `;

  renderStockTable(); // refresh the buttons to match current mode
}

// ===== Render Info Bar =====
function renderInfoBar() {
  const infoBar = document.getElementById("infoBar");
  const playerColor = players[currentPlayer].color;
  const nameColor = isColorDark(playerColor) ? "#ffffff" : playerColor;

  infoBar.innerHTML = `
    Turn ${turn} | 
    <span style="color:${nameColor}">${players[currentPlayer].name}</span> | 
    Money: $${players[currentPlayer].money.toFixed(2)}
    <button id="infoBtn" style="margin-left:20px;">Info</button>
  `;
  infoBar.style.background = playerColor;
  document.getElementById("infoBtn").onclick = () => showPlayerInfo(currentPlayer);
}

// ===== Render Stock Table (Simplified Buttons) =====
function renderStockTable() {
  const tbody = document.querySelector("#stockTable tbody");
  tbody.innerHTML = "";

  stocks.forEach((s, i) => {
    const change = s.change ?? 0;
    const changeClass = change > 0 ? "green" : change < 0 ? "red" : "neutral";

    const btnColor = tradeMode === "buy" ? "#4caf50" : "#f44336";
    const sign = tradeMode === "buy" ? "+" : "-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td onclick="toggleInfo(${i})" style="cursor:pointer; text-decoration:underline;">${s.name}</td>
      <td>$${s.price.toFixed(2)}</td>
      <td class="${changeClass}">${change.toFixed(2)}</td>
      <td>${s.owned[currentPlayer]}</td>
      <td>
        ${[1,5,10,20,100].map(n => `
          <button style="background:${btnColor};color:#fff;" onclick="trade(${i},${n})">
            ${sign}${n}
          </button>
        `).join("")}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ===== Unified Render Function =====
function render() {
  renderInfoBar();

  const buttonContainer = document.querySelector(".buttons");
  buttonContainer.innerHTML = `
    <div id="buySellToggle"></div>
    <button onclick="endTurn()">End Turn</button>
    <button class="danger" onclick="endGame(true)">End Game</button>
  `;

  setTradeMode(tradeMode); // ensures toggle and buttons show correctly
}

// ===== Helper: Detect dark colors =====
function isColorDark(color) {
  let c = color.replace("#","");
  if(c.length === 3) c = c.split("").map(x=>x+x).join("");
  const r = parseInt(c.substr(0,2),16);
  const g = parseInt(c.substr(2,2),16);
  const b = parseInt(c.substr(4,2),16);
  const brightness = (r*299 + g*587 + b*114)/1000;
  return brightness < 140;
}

// ===== Unified Trade Function =====
function trade(stockIndex, amount){
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];

  if(tradeMode === "buy"){
    buy(stockIndex, amount);
  } else {
    let sellAmount = Math.min(amount, stock.owned[currentPlayer]);
    if(sellAmount > 0) sell(stockIndex, sellAmount);
    else popup("You don't own enough shares to sell this amount.");
  }

  renderStockTable(); // refresh buttons after trade
}

// ===== Stock Info Popup =====
function toggleInfo(i){
  const s = stocks[i];
  popup(`<b>${s.name}</b><br>${s.desc}<br><br><i>Price History:</i>`);
  setTimeout(() => drawGraph(s.history, "#2196f3"), 50);
}

// ===== Player Info Popup =====
function showPlayerInfo(playerIndex){
  const p = players[playerIndex];
  let total = p.money;
  let stockDetails = "";

  stocks.forEach(s=>{
    total += s.owned[playerIndex]*s.price;
    if(s.owned[playerIndex]>0){
      const avg = (s.totalSpent[playerIndex]/s.owned[playerIndex]).toFixed(2);
      const value = (s.owned[playerIndex]*s.price).toFixed(2);
      stockDetails += `${s.name}: ${s.owned[playerIndex]} shares, avg $${avg}, current $${value}<br>`;
    }
  });

  const lastWorth = p.history[p.history.length-1];
  const changePercent = (((total-lastWorth)/lastWorth)*100).toFixed(2);

  popup(`
    <b>${p.name}</b><br><br>
    Total Worth: $${total.toFixed(2)}<br>
    Change: ${changePercent}%<br><br>
    <b>Stocks:</b><br>${stockDetails || "None"}<br><br>
    <b>Worth History:</b>
  `);

  setTimeout(() => drawGraph(p.history, p.color), 50);
}

// ===== Podium / Celebration =====
function showPodium(scores){
  document.getElementById("game").classList.add("hidden");
  const podium = document.getElementById("podium");
  podium.classList.remove("hidden");

  document.getElementById("firstPlace").innerText = scores[0].name;
  document.getElementById("secondPlace").innerText = scores[1]?.name || "";
  document.getElementById("thirdPlace").innerText = scores[2]?.name || "";

  const msg = scores.map(s=>`${s.name}: Earned $${s.earned.toFixed(2)} | Total $${s.total.toFixed(2)}`).join("<br>");
  popup(`<b>Game Over!</b><br>Winner: ${scores[0].name}<br><br>${msg}`);

  launchConfetti();
}

function resetPodium(){
  resetGame();
  document.getElementById("podium").classList.add("hidden");
}

// ===== Confetti =====
function launchConfetti() {
  const confettiContainer = document.createElement("div");
  confettiContainer.style.position = "fixed";
  confettiContainer.style.top = "0";
  confettiContainer.style.left = "0";
  confettiContainer.style.width = "100%";
  confettiContainer.style.height = "100%";
  confettiContainer.style.pointerEvents = "none";
  confettiContainer.style.overflow = "hidden";
  confettiContainer.style.zIndex = "2000";
  document.body.appendChild(confettiContainer);

  const colors = ["#FFD700","#C0C0C0","#CD7F32","#f44336","#4caf50","#2196f3"];
  const total = 150;

  for (let i = 0; i < total; i++) {
    const conf = document.createElement("div");
    conf.style.position = "absolute";
    conf.style.width = conf.style.height = Math.random()*8 + 4 + "px";
    conf.style.background = colors[Math.floor(Math.random()*colors.length)];
    conf.style.left = Math.random()*window.innerWidth + "px";
    conf.style.top = "-10px";
    conf.style.opacity = Math.random() + 0.5;
    conf.style.transform = `rotate(${Math.random()*360}deg)`;
    conf.style.borderRadius = "50%";
    conf.style.transition = "transform 3s ease, top 3s ease, opacity 3s ease";

    confettiContainer.appendChild(conf);

    setTimeout(()=>{
      conf.style.top = window.innerHeight + "px";
      conf.style.transform = `rotate(${Math.random()*720}deg)`;
      conf.style.opacity = 0;
    },50);
  }

  setTimeout(()=>document.body.removeChild(confettiContainer), 3500);
}
