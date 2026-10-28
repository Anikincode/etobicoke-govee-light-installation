// etobicokelights.com — mobile menu and the length planner (length guide page).
(() => {
  // ---- Mobile menu ----
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("primary-nav");
  if (menuBtn && nav) {
    const setOpen = open => {
      menuBtn.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
    };
    menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); menuBtn.focus(); }
    });
  }

  // ---- Length planner ----
  // Govee Permanent Outdoor Lights 2 (ca.govee.com, checked 2026-10-28): sold in 50, 100 and 150 ft,
  // 16.4 ft extension lights, can't be cut, one set tops out at 150 ft with extensions included.
  const calc = document.getElementById("calc");
  if (calc) {
    const KITS = [50, 100, 150];
    const EXT = 16.4;
    const MAX = 150;
    const EPS = 1e-9;
    const runsEl = document.getElementById("runs");
    const out = document.getElementById("calc-out");
    const fmt = x => String(Math.round(x * 10) / 10);
    let n = 0;

    const addRow = (name, focus) => {
      n += 1;
      const row = document.createElement("div");
      row.className = "run";
      row.innerHTML =
        `<label class="sr-only" for="run-name-${n}">Stretch ${n} name</label>` +
        `<input id="run-name-${n}" type="text" autocomplete="off" placeholder="e.g. Side eaves">` +
        `<label class="sr-only" for="run-ft-${n}">Stretch ${n} length in feet</label>` +
        `<div class="unit"><input id="run-ft-${n}" type="number" inputmode="decimal" min="0" step="0.5" placeholder="0"><span aria-hidden="true">ft</span></div>` +
        `<button type="button" class="icon-btn" aria-label="Remove stretch ${n}"><svg aria-hidden="true"><use href="#i-x"/></svg></button>`;
      row.querySelector("input[type=text]").value = name || "";
      row.querySelector("button").addEventListener("click", () => {
        row.remove();
        if (!runsEl.querySelector(".run:not(.run-head)")) addRow("", true);
        update();
      });
      runsEl.appendChild(row);
      if (focus) row.querySelector("input[type=text]").focus();
    };

    const update = () => {
      const need = [...runsEl.querySelectorAll("input[type=number]")]
        .map(i => parseFloat(i.value))
        .filter(v => v > 0)
        .reduce((a, b) => a + b, 0);

      if (!need) {
        out.innerHTML = '<p class="muted">Enter at least one length to see which lengths fit.</p>';
        return;
      }

      let html = `<p class="calc-total"><strong>${fmt(need)} ft</strong><span class="muted">to light, about ${fmt(need * 0.3048)} m</span></p>`;

      if (need > MAX + EPS) {
        html += "<p>That's more than one set of Permanent Outdoor Lights 2 can cover. Govee caps a set at 150 ft, extensions included, so this house needs a second set and a plan for where the split goes.</p>";
        out.innerHTML = html;
        return;
      }

      // For each kit length, the fewest 16.4 ft extensions that reach the total without passing 150 ft.
      const options = [];
      KITS.forEach(kit => {
        for (let e = 0; kit + e * EXT <= MAX + EPS; e++) {
          const len = kit + e * EXT;
          if (len >= need - EPS) { options.push({ kit, e, len, spare: len - need }); break; }
        }
      });
      const best = Math.min(...options.map(o => o.spare));

      html += '<ul class="options">' + options.map(o => {
        const ext = o.e ? ` + ${o.e} extension${o.e > 1 ? "s" : ""} (16.4 ft each)` : "";
        const total = o.e ? ` = ${fmt(o.len)} ft` : "";
        const spare = o.spare < 0.05 ? "no spare" : `${fmt(o.spare)} ft spare`;
        const isBest = o.spare === best;
        return `<li${isBest ? ' class="best"' : ""}><strong>${o.kit} ft${ext}</strong>${total} · ${spare}${isBest ? '<span class="tag">Closest fit</span>' : ""}</li>`;
      }).join("") + "</ul>";
      html += '<p class="muted small">Spare length can\'t be trimmed off, so decide where it goes before you buy. Prices differ between these options, so compare them on Govee\'s site.</p>';
      out.innerHTML = html;
    };

    ["Front eaves", "Front peak, left slope", "Front peak, right slope"].forEach(name => addRow(name, false));
    document.getElementById("add-run").addEventListener("click", () => { addRow("", true); update(); });
    runsEl.addEventListener("input", update);
    update();
  }
})();
