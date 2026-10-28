// etobicokelights.com — menu, house demo (home page), length planner (length guide page).
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

  // ---- House demo: scenes and day/night ----
  const scene = document.getElementById("scene");
  if (scene) {
    const NS = "http://www.w3.org/2000/svg";
    const scenes = {
      warm:      { name: "warm white", colors: ["#FFC978"] },
      halloween: { name: "orange and purple", colors: ["#FF7A1A", "#8B5CF6"] },
      christmas: { name: "red and green", colors: ["#EF4444", "#22C55E"] },
      game:      { name: "blue and white", colors: ["#2563EB", "#F8FAFC"] }
    };
    const g = document.getElementById("bulbs");
    const label = document.getElementById("scene-label");
    const sky = document.getElementById("sky");
    const stars = document.getElementById("stars");
    const orb = document.getElementById("orb");
    const siding = document.getElementById("siding");
    const roof = document.getElementById("roof");
    const ground = document.getElementById("ground");
    const wins = document.querySelectorAll(".win");
    const dn = document.getElementById("daynight");
    const sceneButtons = document.querySelectorAll("[data-scene]");

    // Bulbs along the two roof edges: (100,180) -> (300,72) -> (500,180)
    const edges = [[100, 180, 300, 72], [300, 72, 500, 180]];
    const bulbs = [];
    edges.forEach(([x1, y1, x2, y2], e) => {
      const n = 13;
      for (let i = e ? 1 : 0; i <= n; i++) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", x1 + (x2 - x1) * i / n);
        c.setAttribute("cy", y1 + (y2 - y1) * i / n + 4);
        c.setAttribute("r", 3.4);
        c.setAttribute("class", "bulb");
        g.appendChild(c);
        bulbs.push(c);
      }
    });

    let current = "warm";
    let night = true;

    const render = () => {
      const s = scenes[current];
      bulbs.forEach((b, i) => {
        b.setAttribute("fill", night ? s.colors[i % s.colors.length] : "#9AA3B2");
        b.setAttribute("filter", night ? "url(#glow)" : "");
        b.style.opacity = night ? 1 : 0.55;
      });
      sky.setAttribute("fill", night ? "url(#sky-night)" : "url(#sky-day)");
      stars.style.opacity = night ? 0.8 : 0;
      orb.setAttribute("fill", night ? "#F1F5F9" : "#FDE68A");
      siding.setAttribute("fill", night ? "#2B3550" : "#C9CED8");
      roof.setAttribute("fill", night ? "#1C2236" : "#4B5263");
      ground.setAttribute("fill", night ? "#1A2A1F" : "#7FAF6A");
      wins.forEach(w => w.style.opacity = night ? 0.55 : 0.2);
      label.textContent = night
        ? `Illustration of a house at night with ${s.name} lights along the roofline`
        : "Illustration of the same house in daylight, with the roofline lights switched off";
      dn.setAttribute("aria-pressed", String(!night));
      dn.querySelector("span").textContent = night ? "Show daytime" : "Show night";
      dn.querySelector("use").setAttribute("href", night ? "#i-sun" : "#i-moon");
    };

    sceneButtons.forEach(btn => btn.addEventListener("click", () => {
      current = btn.dataset.scene;
      night = true; // scenes only make sense with the lights on
      sceneButtons.forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    }));
    dn.addEventListener("click", () => { night = !night; render(); });
    render();
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
