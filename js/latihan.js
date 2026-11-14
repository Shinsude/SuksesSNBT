(() => {
  "use strict";

  const availableCard = document.querySelector(".practice-card--available");
  if (!availableCard) return;

  availableCard.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const action = availableCard.querySelector("a");
    if (action) action.focus();
  });
})();
