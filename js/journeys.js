// Student journeys (journeys.html): "Read the story" opens the full story in a pop-up, poster-style.
// Each tile is a <details> element, so without this script it still opens in place. Owner: Arya.
// The pop-up is the browser's own <dialog>: it keeps keyboard focus inside, closes with Esc, and puts focus
// back on the tile afterwards. Content is copied from the tile's own elements (never built from text).
const dialog = document.getElementById("journey-dialog");

if (dialog && typeof dialog.showModal === "function") {
  const body = dialog.querySelector("[data-dialog-body]");

  document.querySelectorAll(".journey-tile > summary").forEach((summary) => {
    summary.addEventListener("click", (event) => {
      event.preventDefault(); // don't open the tile in place
      const tile = summary.parentElement;
      const parts = [".tile-poster", ".tile-head", ".tile-story"]
        .map((selector) => tile.querySelector(selector))
        .filter(Boolean)
        .map((node) => node.cloneNode(true));
      // Copies need their own ids (the drawing's clip path), and the title labels the pop-up
      parts.forEach((part) => {
        part.querySelectorAll("[id]").forEach((el) => { el.id = `${el.id}-pop`; });
        part.querySelectorAll("[clip-path]").forEach((el) => {
          el.setAttribute("clip-path", el.getAttribute("clip-path").replace(/\)$/, "-pop)"));
        });
      });
      const title = parts.map((part) => part.querySelector("h2")).find(Boolean);
      if (title) title.id = "journey-dialog-title";
      body.replaceChildren(...parts);
      document.documentElement.classList.add("overflow-hidden"); // the page behind doesn't scroll
      dialog.showModal();
    });
  });

  // Let the page scroll again straight away on every way of closing. The browser's own "close" event can arrive
  // late, so it is only the backup.
  const unlock = () => document.documentElement.classList.remove("overflow-hidden");
  const closeDialog = () => { unlock(); dialog.close(); };
  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeDialog));
  // A click on the dimmed area outside the card closes it
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("cancel", unlock); // Esc
  // Backup. A late "close" can arrive after the next story has already opened, so only unlock if it is really shut.
  dialog.addEventListener("close", () => { if (!dialog.open) unlock(); });
}

// The kid's video ("In his own words"): no right-click "Save video as". Together with controlslist="nodownload" (which
// hides the player's own Download button) this stops casual saving. It can't stop a determined person, so the video
// itself must never show a face or anything else that identifies him.
document.querySelectorAll("video").forEach((video) => video.addEventListener("contextmenu", (event) => event.preventDefault()));
