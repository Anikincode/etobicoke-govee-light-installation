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
  // Govee's Canadian product pages, checked 2026-10-28. Both models take 16.4 ft extension lights.
  //   Permanent Outdoor Lights 2: 50, 100 or 150 ft, can't be cut, one set tops out at 150 ft.
  //   Permanent Outdoor Lights Pro: 100, 150 or 200 ft, can be cut, one set tops out at 200 ft,
  //   and past 150 ft it needs Govee's driver module (included with the 200 ft kit).
  const calc = document.getElementById("calc");
  if (calc) {
    const MODELS = {
      pol2: { name: "Permanent Outdoor Lights 2", kits: [50, 100, 150], max: 150, cut: false },
      pro: { name: "Permanent Outdoor Lights Pro", kits: [100, 150, 200], max: 200, cut: true, driverOver: 150, driverKit: 200 }
    };
    const EXT = 16.4;
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

      const m = MODELS[calc.querySelector("input[name=model]:checked").value];
      let html = `<p class="calc-total"><strong>${fmt(need)} ft</strong><span class="muted">to light, about ${fmt(need * 0.3048)} m</span></p>`;

      if (need > m.max + EPS) {
        html += `<p>That's more than one set of ${m.name} can cover. Govee caps a set at ${m.max} ft, extensions included, so this house needs a second set and a plan for where the split goes.</p>`;
        if (!m.cut && need <= MODELS.pro.max + EPS) {
          html += '<p class="muted small">The Permanent Outdoor Lights Pro goes up to 200 ft. Switch the model above to see it.</p>';
        }
        out.innerHTML = html;
        return;
      }

      // For each kit length, the fewest 16.4 ft extensions that reach the total without passing the cap.
      const options = [];
      m.kits.forEach(kit => {
        for (let e = 0; kit + e * EXT <= m.max + EPS; e++) {
          const len = kit + e * EXT;
          if (len >= need - EPS) { options.push({ kit, e, len, spare: len - need }); break; }
        }
      });
      const best = Math.min(...options.map(o => o.spare));

      html += '<ul class="options">' + options.map(o => {
        const ext = o.e ? ` + ${o.e} extension${o.e > 1 ? "s" : ""} (16.4 ft each)` : "";
        const total = o.e ? ` = ${fmt(o.len)} ft` : "";
        let spare = o.spare < 0.05 ? "no spare" : (m.cut ? `cut ${fmt(o.spare)} ft off` : `${fmt(o.spare)} ft spare`);
        if (m.driverOver && o.len > m.driverOver + EPS && o.kit !== m.driverKit) spare += " · needs Govee's driver module";
        const isBest = o.spare === best;
        return `<li${isBest ? ' class="best"' : ""}><strong>${o.kit} ft${ext}</strong>${total} · ${spare}${isBest ? '<span class="tag">Closest fit</span>' : ""}</li>`;
      }).join("") + "</ul>";
      html += m.cut
        ? '<p class="muted small">The Pro can be cut, so the extra comes off at the install and the run ends where your roofline does. Prices differ between these options, so compare them on Govee\'s site.</p>'
        : '<p class="muted small">Spare length can\'t be trimmed off, so decide where it goes before you buy. Prices differ between these options, so compare them on Govee\'s site.</p>';
      out.innerHTML = html;
    };

    ["Front eaves", "Front peak, left slope", "Front peak, right slope"].forEach(name => addRow(name, false));
    document.getElementById("add-run").addEventListener("click", () => { addRow("", true); update(); });
    runsEl.addEventListener("input", update);
    calc.querySelectorAll("input[name=model]").forEach(r => r.addEventListener("change", update));
    update();
  }
})();
