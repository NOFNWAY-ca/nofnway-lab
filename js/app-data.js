    async function refreshDevicesAndAlerts(forceSound) {
      const stateOk = await fetchHomeAssistantStates();
      await fetchHomeAssistantLogbook();
      renderStat();
      renderAlerts();
      if (forceSound) {
        playSound(stateOk ? "success" : "error");
      }
    }

    async function fetchHomeAssistantStates() {
      if (!state.settings.haUrl || !state.settings.haToken) {
        state.haConnected = false;
        state.haFailureCount = 0;
        el.haStatusText.textContent = "HOME ASSISTANT NOT CONFIGURED";
        return false;
      }
      try {
        const result = await Promise.all(DEVICE_CONFIG.map(async (device) => {
          const response = await fetch(state.settings.haUrl + "/api/states/" + device.entityId, {
            headers: { Authorization: "Bearer " + state.settings.haToken, "Content-Type": "application/json" }
          });
          if (!response.ok) {
            throw new Error("STATE FETCH FAILED");
          }
          const payload = await response.json();
          return [device.key, payload];
        }));
        state.haDevices = Object.fromEntries(result);
        state.haConnected = true;
        state.haFailureCount = 0;
        el.haStatusText.textContent = "HOME ASSISTANT LINK ONLINE";
        return true;
      } catch (error) {
        console.error(error);
        state.haConnected = false;
        state.haFailureCount += 1;
        el.haStatusText.textContent = "HOME ASSISTANT UNREACHABLE";
        DEVICE_CONFIG.forEach((device) => {
          state.haDevices[device.key] = { state: "UNAVAILABLE", attributes: {}, last_changed: new Date().toISOString() };
        });
        if (state.haFailureCount >= 2 && Date.now() - state.haLastAlertAt > 10 * 60 * 1000) {
          state.haLastAlertAt = Date.now();
          pushAlert({
            id: "ha-unreachable-" + new Date().toISOString().slice(0, 16),
            source: "HOME ASSISTANT",
            type: "DEVICE OFFLINE",
            detail: "HOME ASSISTANT UNREACHABLE"
          }, true);
        }
        return false;
      }
    }

    async function fetchHomeAssistantLogbook() {
      if (!state.settings.haUrl || !state.settings.haToken) {
        return;
      }
      try {
        const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const response = await fetch(state.settings.haUrl + "/api/logbook/" + encodeURIComponent(since), {
          headers: { Authorization: "Bearer " + state.settings.haToken }
        });
        if (!response.ok) {
          return;
        }
        const entries = await response.json();
        const mapped = entries.slice(0, 16).map((entry, index) => ({
          id: entry.when + "-" + entry.name + "-" + index,
          timestamp: entry.when || new Date().toISOString(),
          source: (entry.name || "SYSTEM").toUpperCase(),
          type: (entry.message || entry.state || "EVENT").toUpperCase(),
          detail: ((entry.entity_id || "") + " " + (entry.domain || "")).trim(),
          unread: !state.alerts.some((saved) => saved.id === entry.when + "-" + entry.name + "-" + index)
        }));
        const merged = [...mapped];
        state.alerts.forEach((alert) => {
          if (!merged.some((item) => item.id === alert.id)) {
            merged.push(alert);
          }
        });
        state.alerts = merged
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 30);
        persistAlerts();
      } catch (error) {
        console.error(error);
      }
    }

    function renderStat() {
      el.statContent.textContent = "";
      DEVICE_CONFIG.forEach((device) => {
        const status = state.haDevices[device.key];
        const card = document.createElement("div");
        card.className = "device-card";
        const head = document.createElement("div");
        head.className = "device-head";
        const label = document.createElement("div");
        const title = document.createElement("div");
        title.className = "section-title";
        title.textContent = device.label;
        const entity = document.createElement("div");
        entity.className = "tiny";
        entity.textContent = device.entityId;
        label.append(title, entity);
        const pill = document.createElement("div");
        pill.className = "status-pill";
        const dot = document.createElement("span");
        dot.className = "dot";
        const stateLabel = document.createElement("span");
        const readable = formatDeviceState(device.type, status);
        dot.style.color = readable.isOn ? "var(--ok)" : readable.isError ? "var(--danger)" : "var(--warn)";
        stateLabel.textContent = readable.label;
        pill.append(dot, stateLabel);
        head.append(label, pill);
        card.appendChild(head);

        const actions = document.createElement("div");
        actions.className = "controls-row";
        const toggle = document.createElement("button");
        toggle.textContent = readable.action;
        toggle.disabled = !state.haConnected;
        toggle.addEventListener("click", () => controlDevice(device));
        actions.appendChild(toggle);

        if (device.type === "light" && status && typeof status.attributes?.brightness === "number") {
          const wrap = document.createElement("div");
          wrap.className = "brightness";
          const range = document.createElement("input");
          range.type = "range";
          range.min = 1;
          range.max = 255;
          range.value = status.attributes.brightness;
          range.addEventListener("change", () => setLightBrightness(device, Number(range.value)));
          const value = document.createElement("span");
          value.textContent = Math.round((Number(range.value) / 255) * 100) + "%";
          range.addEventListener("input", () => {
            value.textContent = Math.round((Number(range.value) / 255) * 100) + "%";
          });
          wrap.append(range, value);
          actions.appendChild(wrap);
        }

        const last = document.createElement("div");
        last.className = "tiny";
        last.textContent = "LAST UPDATED " + formatTimestamp(status?.last_changed || new Date().toISOString());
        card.append(actions, last);
        if (!state.haConnected) {
          const error = document.createElement("div");
          error.className = "danger tiny";
          error.textContent = "CONNECTION ERROR";
          card.appendChild(error);
        }
        el.statContent.appendChild(card);
      });
    }

    function formatDeviceState(type, status) {
      const raw = (status?.state || "UNKNOWN").toLowerCase();
      if (raw === "unavailable" || raw === "unknown") {
        return { label: "OFFLINE", action: "RETRY", isOn: false, isError: true };
      }
      if (type === "cover") {
        return { label: raw.toUpperCase(), action: raw === "open" ? "CLOSE DOOR" : "OPEN DOOR", isOn: raw === "open", isError: false };
      }
      if (type === "lock") {
        return { label: raw.toUpperCase(), action: raw === "locked" ? "UNLOCK" : "LOCK", isOn: raw === "locked", isError: false };
      }
      if (type === "light") {
        return { label: raw.toUpperCase(), action: raw === "on" ? "TURN OFF" : "TURN ON", isOn: raw === "on", isError: false };
      }
      return { label: raw.toUpperCase(), action: "TOGGLE", isOn: false, isError: false };
    }

    async function controlDevice(device) {
      if (!state.haConnected) {
        playSound("error");
        return;
      }
      try {
        const payload = state.haDevices[device.key];
        let service = "";
        let domain = "";
        if (device.type === "cover") {
          domain = "cover";
          service = payload.state === "open" ? "close_cover" : "open_cover";
        } else if (device.type === "lock") {
          domain = "lock";
          service = payload.state === "locked" ? "unlock" : "lock";
        } else if (device.type === "light") {
          domain = "light";
          service = payload.state === "on" ? "turn_off" : "turn_on";
        }
        await callHomeAssistantService(domain, service, { entity_id: device.entityId });
        pushAlert({ source: device.label, type: service.replace(/_/g, " ").toUpperCase(), detail: "COMMAND SENT" }, true);
        await fetchHomeAssistantStates();
        renderStat();
        playSound("success");
      } catch (error) {
        console.error(error);
        pushAlert({ source: device.label, type: "COMMAND FAILED", detail: error.message }, true);
        playSound("error");
      }
    }

    async function setLightBrightness(device, brightness) {
      try {
        await callHomeAssistantService("light", "turn_on", { entity_id: device.entityId, brightness });
        await fetchHomeAssistantStates();
        renderStat();
        pushAlert({ source: device.label, type: "BRIGHTNESS", detail: "SET TO " + Math.round((brightness / 255) * 100) + "%" }, false);
      } catch (error) {
        console.error(error);
        playSound("error");
      }
    }

    async function callHomeAssistantService(domain, service, body) {
      const response = await fetch(state.settings.haUrl + "/api/services/" + domain + "/" + service, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + state.settings.haToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error("SERVICE FAILED");
      }
      return response.json();
    }

    async function handleBarcodeLookup() {
      const barcode = el.barcodeInput.value.trim();
      if (!barcode) {
        el.barcodeStatus.textContent = "NO BARCODE DETECTED";
        playSound("error");
        return;
      }
      el.barcodeStatus.textContent = "LOOKING UP " + barcode;
      try {
        const response = await fetch("https://world.openfoodfacts.org/api/v0/product/" + encodeURIComponent(barcode) + ".json");
        if (!response.ok) {
          throw new Error("LOOKUP FAILED");
        }
        const data = await response.json();
        const name = data.product?.product_name || data.product?.generic_name || "UNKNOWN ITEM";
        addInventoryItem({
          name,
          quantity: 1,
          category: state.inventoryCategory,
          notes: data.product?.brands || "",
          barcode
        });
        el.barcodeStatus.textContent = "BARCODE ADDED";
        el.barcodeInput.value = "";
        playSound("success");
      } catch (error) {
        console.error(error);
        addInventoryItem({
          name: "BARCODE " + barcode,
          quantity: 1,
          category: state.inventoryCategory,
          notes: "LOOKUP FAILED",
          barcode
        });
        el.barcodeStatus.textContent = "LOOKUP FAILED. RAW CODE STORED.";
        el.barcodeInput.value = "";
        playSound("error");
      }
    }

    function addInventoryItem(item) {
      if (!item.name) {
        playSound("error");
        return;
      }
      const normalizedName = item.name.trim().toUpperCase();
      const existing = state.inventory.find((entry) => entry.category === item.category && entry.name === normalizedName);
      if (existing) {
        existing.quantity += Number(item.quantity) || 1;
        existing.notes = item.notes || existing.notes;
        existing.updatedAt = new Date().toISOString();
      } else {
        state.inventory.unshift({
          id: crypto.randomUUID(),
          name: normalizedName,
          quantity: Number(item.quantity) || 1,
          category: item.category,
          notes: item.notes || "",
          barcode: item.barcode || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      saveStorage(STORAGE_KEYS.inventory, state.inventory);
      renderInventory();
      playSound("success");
    }

    function renderInventory() {
      el.inventoryList.textContent = "";
      const items = state.inventory
        .filter((item) => item.category === state.inventoryCategory)
        .filter((item) => {
          if (!state.inventorySearch) {
            return true;
          }
          return [item.name, item.notes, item.barcode].join(" ").toUpperCase().includes(state.inventorySearch);
        });
      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "section-card";
        empty.textContent = "NO ITEMS IN THIS CATEGORY";
        el.inventoryList.appendChild(empty);
        return;
      }
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "inventory-row";
        const info = document.createElement("div");
        const name = document.createElement("div");
        name.className = "section-title";
        name.textContent = item.name;
        const meta = document.createElement("div");
        meta.className = "inventory-meta";
        meta.textContent = "NOTES: " + (item.notes || "NONE") + " | UPDATED " + formatTimestamp(item.updatedAt);
        info.append(name, meta);
        const controls = document.createElement("div");
        controls.className = "qty-controls";
        const minus = document.createElement("button");
        minus.textContent = "-";
        minus.addEventListener("click", () => adjustInventory(item.id, -1));
        const qty = document.createElement("div");
        qty.className = "qty-value";
        qty.textContent = item.quantity;
        const plus = document.createElement("button");
        plus.textContent = "+";
        plus.addEventListener("click", () => adjustInventory(item.id, 1));
        const del = document.createElement("button");
        del.textContent = "X";
        del.addEventListener("click", () => deleteInventory(item.id));
        controls.append(minus, qty, plus, del);
        row.append(info, controls);
        el.inventoryList.appendChild(row);
      });
    }

    function adjustInventory(id, delta) {
      const item = state.inventory.find((entry) => entry.id === id);
      if (!item) {
        return;
      }
      item.quantity += delta;
      item.updatedAt = new Date().toISOString();
      if (item.quantity <= 0) {
        state.inventory = state.inventory.filter((entry) => entry.id !== id);
      }
      saveStorage(STORAGE_KEYS.inventory, state.inventory);
      renderInventory();
      playSound(delta > 0 ? "click" : "beep");
    }

    function deleteInventory(id) {
      state.inventory = state.inventory.filter((entry) => entry.id !== id);
      saveStorage(STORAGE_KEYS.inventory, state.inventory);
      renderInventory();
      playSound("error");
    }

    function pushAlert(alert, unread = true) {
      const id = alert.id || crypto.randomUUID();
      const existing = state.alerts.find((entry) => entry.id === id);
      if (existing) {
        return;
      }
      state.alerts.unshift({
        id,
        timestamp: alert.timestamp || new Date().toISOString(),
        source: alert.source,
        type: alert.type,
        detail: alert.detail || "",
        unread
      });
      state.alerts = state.alerts.slice(0, 30);
      persistAlerts();
      renderAlerts();
    }

    function persistAlerts() {
      saveStorage(STORAGE_KEYS.alerts, state.alerts);
    }

    function renderAlerts() {
      el.alertsList.textContent = "";
      if (!state.alerts.length) {
        const empty = document.createElement("div");
        empty.className = "alert-row";
        empty.textContent = "NO ALERTS LOGGED";
        el.alertsList.appendChild(empty);
        return;
      }
      state.alerts.forEach((alert) => {
        const row = document.createElement("div");
        row.className = "alert-row" + (alert.unread ? " unread" : "");
        const title = document.createElement("div");
        title.className = "section-title";
        title.textContent = alert.source + " | " + alert.type;
        const meta = document.createElement("div");
        meta.className = "alert-meta";
        meta.textContent = formatTimestamp(alert.timestamp) + (alert.detail ? " | " + alert.detail : "");
        row.append(title, meta);
        row.addEventListener("click", () => {
          alert.unread = false;
          persistAlerts();
          renderAlerts();
        });
        el.alertsList.appendChild(row);
      });
    }

    function renderSaves() {
      el.savesList.textContent = "";
      const entries = Object.entries(state.saves);
      if (!entries.length) {
        const empty = document.createElement("div");
        empty.className = "save-row";
        empty.textContent = "NO SAVED GAMES";
        el.savesList.appendChild(empty);
        return;
      }
      entries
        .sort((a, b) => new Date(b[1].savedAt) - new Date(a[1].savedAt))
        .forEach(([gameId, save]) => {
          const row = document.createElement("div");
          row.className = "save-row";
          const title = document.createElement("div");
          title.className = "section-title";
          title.textContent = getGameName(gameId);
          const meta = document.createElement("div");
          meta.className = "save-meta";
          meta.textContent = save.summary + " | " + formatTimestamp(save.savedAt);
          row.append(title, meta);
          row.addEventListener("click", () => {
            launchGame(gameId, save.data);
            playSound("click");
          });
          el.savesList.appendChild(row);
        });
    }

    function storeGameSave(gameId, payload) {
      state.saves[gameId] = {
        savedAt: new Date().toISOString(),
        summary: payload.summary,
        data: payload
      };
      saveStorage(STORAGE_KEYS.saves, state.saves);
    }

    function storeHighScore(gameId, score) {
      state.highscores[gameId] = Math.max(state.highscores[gameId] || 0, Math.floor(score));
      saveStorage(STORAGE_KEYS.highscores, state.highscores);
      renderGames();
    }

    function setupMap() {
      el.mapArt.textContent =
`+---------------------------------------------------+
|                   HOUSE NODE                      |
|  +-------------------+-----------+---------------+|
|  |  FRIDGE           | MAN DOOR  |   FREEZER     ||
|  |  COLD STORAGE     | [LOCK]    |   DEEP COLD   ||
|  +-------------------+-----+-----+---------------+|
|                                |                  |
|                                |                  |
|                                |                  |
|          GARAGE BAY            | WORKBENCH        |
|                                | HARDWARE WALL    |
|   +------------------------+   |                  |
|   | MYQ GARAGE DOOR        |   |                  |
|   | MAIN ACCESS SHUTTER    |   |                  |
|   +------------------------+   |                  |
|                                                   |
+---------------------------------------------------+`;
    }

    function renderGames() {
      el.gamesGrid.textContent = "";
      GAME_CATALOG.forEach((game) => {
        const card = document.createElement("div");
        card.className = "game-card";
        const title = document.createElement("strong");
        title.textContent = game.name;
        const desc = document.createElement("div");
        desc.className = "game-meta";
        desc.textContent = game.description;
        const meta = document.createElement("div");
        meta.className = "game-meta";
        const save = state.saves[game.id];
        meta.textContent = "HIGH SCORE " + (state.highscores[game.id] || 0) + (save ? " | SAVE READY" : "");
        const button = document.createElement("button");
        button.textContent = save ? "RESUME" : "LAUNCH";
        button.addEventListener("click", () => launchGame(game.id, save?.data || null));
        card.append(title, desc, meta, button);
        el.gamesGrid.appendChild(card);
      });
    }

    function launchGame(gameId, savedData) {
      const factories = {
        "atomic-command": createAtomicCommand,
        "zeta-invaders": createZetaInvaders,
        "pipfall": createPipfall,
        "red-menace": createRedMenace,
        "rad-pong": createRadPong,
        "zeta-launch": createZetaLaunch
      };
      const factory = factories[gameId];
      if (!factory) {
        return;
      }
      stopGameLoop();
      resetInputState();
      el.gameCanvas.onclick = null;
      state.activeGame = factory(savedData);
      el.gameTitle.textContent = state.activeGame.name;
      el.gameOverlay.classList.add("active");
      resizeCanvas();
      configureGameControls(state.activeGame);
      playSound("click");
      state.lastFrame = performance.now();
      state.gameLoopId = requestAnimationFrame(gameLoop);
    }

    function configureGameControls(game) {
      el.gameActions.textContent = "";
      el.touchControls.textContent = "";
      const actions = game.actions || [];
      actions.forEach((action) => {
        const button = document.createElement("button");
        button.textContent = action.label;
        button.addEventListener("click", action.handler);
        el.gameActions.appendChild(button);
      });
      const controls = game.touchControls || [];
      controls.forEach((control) => {
        const button = document.createElement("button");
        button.textContent = control.label;
        const press = (value) => {
          control.handler(value);
        };
        button.addEventListener("pointerdown", (event) => {
          if (button.setPointerCapture) {
            button.setPointerCapture(event.pointerId);
          }
          press(true);
        });
        button.addEventListener("pointerup", (event) => {
          if (button.releasePointerCapture && button.hasPointerCapture?.(event.pointerId)) {
            button.releasePointerCapture(event.pointerId);
          }
          press(false);
        });
        button.addEventListener("pointercancel", () => press(false));
        button.addEventListener("lostpointercapture", () => press(false));
        button.addEventListener("pointerleave", () => press(false));
        el.touchControls.appendChild(button);
      });
    }

    function gameLoop(timestamp) {
      if (!state.activeGame) {
        return;
      }
      const dt = Math.min((timestamp - state.lastFrame) / 1000, 0.033);
      state.lastFrame = timestamp;
      state.activeGame.update(dt);
      state.activeGame.draw(ctx, el.gameCanvas.width, el.gameCanvas.height);
      updateGameMeta();
      state.gameLoopId = requestAnimationFrame(gameLoop);
    }

    function updateGameMeta() {
      if (!state.activeGame) {
        return;
      }
      el.gameMetaBar.textContent = "";
      state.activeGame.meta().forEach((line) => {
        const item = document.createElement("span");
        item.textContent = line;
        el.gameMetaBar.appendChild(item);
      });
    }

    function exitGame() {
      if (state.activeGame && state.activeGame.serialize) {
        storeGameSave(state.activeGame.id, state.activeGame.serialize());
      }
      stopGameLoop();
      resetInputState();
      el.gameCanvas.onclick = null;
      state.activeGame = null;
      el.gameOverlay.classList.remove("active");
      renderSaves();
      renderGames();
      playSound("click");
    }

    function stopGameLoop() {
      if (state.gameLoopId) {
        cancelAnimationFrame(state.gameLoopId);
        state.gameLoopId = null;
      }
    }

    function resizeCanvas() {
      const rect = el.canvasWrap.getBoundingClientRect();
      el.gameCanvas.width = Math.max(1, Math.floor(rect.width));
      el.gameCanvas.height = Math.max(1, Math.floor(rect.height));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
