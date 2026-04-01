// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  console.log("Game Ready");

  // Set default trade mode
  setTradeMode("buy");

  // Trigger initial player input generation
  document.getElementById("playerCount").dispatchEvent(new Event("change"));
});
