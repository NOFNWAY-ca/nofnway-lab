    const STORAGE_KEYS = {
      settings: "robco-garage-settings",
      inventory: "robco-garage-inventory",
      alerts: "robco-garage-alerts",
      saves: "robco-garage-saves",
      highscores: "robco-garage-highscores"
    };

    const THEMES = {
      green: { bg: "#0a0f0a", panel: "#0d160d", panel2: "#101a10", text: "#20c20e", muted: "#78b871", glow: "rgba(32, 194, 14, 0.24)" },
      amber: { bg: "#120d05", panel: "#191108", panel2: "#23180b", text: "#ffb000", muted: "#dfb76d", glow: "rgba(255, 176, 0, 0.22)" },
      blue: { bg: "#071019", panel: "#0b1521", panel2: "#0f1b2a", text: "#58b6ff", muted: "#82bddc", glow: "rgba(88, 182, 255, 0.22)" },
      red: { bg: "#140809", panel: "#1b0d10", panel2: "#240f12", text: "#ff5a4f", muted: "#e09991", glow: "rgba(255, 90, 79, 0.22)" }
    };

    const TABS = [
      { id: "stat", label: "STAT" },
      { id: "item", label: "ITEM" },
      { id: "data", label: "DATA" },
      { id: "map", label: "MAP" },
      { id: "games", label: "GAMES" }
    ];

    const INVENTORY_CATEGORIES = [
      { id: "food", label: "FOOD" },
      { id: "supplies", label: "SUPPLIES" },
      { id: "tools", label: "TOOLS" }
    ];

    const DEVICE_CONFIG = [
      { key: "garage", entityId: "cover.myq_garage_door", label: "MYQ GARAGE DOOR", type: "cover" },
      { key: "lock", entityId: "lock.man_door", label: "MAN DOOR LOCK", type: "lock" },
      { key: "lights", entityId: "light.globe_outdoor_lights", label: "OUTDOOR LIGHTS", type: "light" }
    ];

    const GAME_CATALOG = [
      { id: "atomic-command", name: "ATOMIC COMMAND", description: "PROTECT THREE SILOS FROM FALLING WARHEADS." },
      { id: "zeta-invaders", name: "ZETA INVADERS", description: "ZETAN RAIDERS DESCEND IN WAVES. HOLD THE ROBCO BATTERY." },
      { id: "pipfall", name: "PIPFALL", description: "RUN THE WASTELAND, CLEAR HAZARDS, COLLECT CAPS." },
      { id: "red-menace", name: "RED MENACE", description: "ASCEND THE GIRDER MAZE, EVADE BARRELS, RESCUE THE DWELLER." },
      { id: "rad-pong", name: "RAD PONG", description: "SUPER MUTANTS BAT A LIVE GRENADE ACROSS THE WASTELAND." },
      { id: "zeta-launch", name: "ZETA LAUNCH PROTOCOL", description: "STACK ROCKET STAGES TRUE OR WATCH THE LAUNCH FAIL." }
    ];

    const DEFAULT_SETTINGS = {
      theme: "green",
      sound: true,
      bypassHack: false,
      haUrl: "",
      haToken: ""
    };

    const state = {
      currentTab: "stat",
      inventoryCategory: "food",
      inventorySearch: "",
      settings: loadStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS, migrateSettings),
      inventory: loadStorage(STORAGE_KEYS.inventory, [], migrateInventory),
      alerts: loadStorage(STORAGE_KEYS.alerts, [], migrateAlerts),
      saves: loadStorage(STORAGE_KEYS.saves, {}, migrateSaves),
      highscores: loadStorage(STORAGE_KEYS.highscores, {}, migrateHighscores),
      haDevices: {},
      haConnected: false,
      haFailureCount: 0,
      haLastAlertAt: 0,
      hackGame: null,
      wireGame: null,
      audioReady: false,
      audioCtx: null,
      activeGame: null,
      gameLoopId: null,
      lastFrame: 0,
      keys: {}
    };

    const el = {
      bottomTabs: document.getElementById("bottomTabs"),
      screen: document.getElementById("screen"),
      tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
      settingsBtn: document.getElementById("settingsBtn"),
      settingsModal: document.getElementById("settingsModal"),
      closeSettingsBtn: document.getElementById("closeSettingsBtn"),
      themeSelect: document.getElementById("themeSelect"),
      soundToggleBtn: document.getElementById("soundToggleBtn"),
      hackBypassBtn: document.getElementById("hackBypassBtn"),
      saveSettingsBtn: document.getElementById("saveSettingsBtn"),
      testConnectionBtn: document.getElementById("testConnectionBtn"),
      haUrlInput: document.getElementById("haUrlInput"),
      haTokenInput: document.getElementById("haTokenInput"),
      settingsStatus: document.getElementById("settingsStatus"),
      statContent: document.getElementById("statContent"),
      refreshDevicesBtn: document.getElementById("refreshDevicesBtn"),
      haStatusText: document.getElementById("haStatusText"),
      inventorySubtabs: document.getElementById("inventorySubtabs"),
      inventorySearch: document.getElementById("inventorySearch"),
      inventoryList: document.getElementById("inventoryList"),
      barcodeInput: document.getElementById("barcodeInput"),
      barcodeLookupBtn: document.getElementById("barcodeLookupBtn"),
      barcodeFocusBtn: document.getElementById("barcodeFocusBtn"),
      barcodeStatus: document.getElementById("barcodeStatus"),
      manualItemForm: document.getElementById("manualItemForm"),
      manualName: document.getElementById("manualName"),
      manualQty: document.getElementById("manualQty"),
      manualCategory: document.getElementById("manualCategory"),
      manualNotes: document.getElementById("manualNotes"),
      alertsList: document.getElementById("alertsList"),
      markAlertsReadBtn: document.getElementById("markAlertsReadBtn"),
      savesList: document.getElementById("savesList"),
      mapArt: document.getElementById("mapArt"),
      gamesGrid: document.getElementById("gamesGrid"),
      gamesStatus: document.getElementById("gamesStatus"),
      activeThemeLabel: document.getElementById("activeThemeLabel"),
      topline: document.getElementById("topline"),
      hackOverlay: document.getElementById("hackOverlay"),
      hackGameContent: document.getElementById("hackGameContent"),
      wireGameContent: document.getElementById("wireGameContent"),
      wireCanvas: document.getElementById("wireCanvas"),
      wireStatus: document.getElementById("wireStatus"),
      hackSubline: document.getElementById("hackSubline"),
      attemptsSection: document.getElementById("attemptsSection"),
      hackGrid: document.getElementById("hackGrid"),
      attemptsView: document.getElementById("attemptsView"),
      hackLog: document.getElementById("hackLog"),
      regenHackBtn: document.getElementById("regenHackBtn"),
      hackHelpBtn: document.getElementById("hackHelpBtn"),
      hackSettingsBtn: document.getElementById("hackSettingsBtn"),
      gameOverlay: document.getElementById("gameOverlay"),
      gameTitle: document.getElementById("gameTitle"),
      gameMetaBar: document.getElementById("gameMetaBar"),
      gameCanvas: document.getElementById("gameCanvas"),
      canvasWrap: document.getElementById("canvasWrap"),
      exitGameBtn: document.getElementById("exitGameBtn"),
      saveGameBtn: document.getElementById("saveGameBtn"),
      gameActions: document.getElementById("gameActions"),
      touchControls: document.getElementById("touchControls")
    };

    const ctx = el.gameCanvas.getContext("2d");

    function init() {
      renderTabs();
      renderInventorySubtabs();
      bindEvents();
      applyTheme(state.settings.theme);
      populateSettingsForm();
      renderAll();
      setupMap();
      maybeShowHackScreen();
      startPolling();
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
    }

    function bindEvents() {
      el.settingsBtn.addEventListener("click", () => openSettings());
      el.closeSettingsBtn.addEventListener("click", closeSettings);
      el.settingsModal.addEventListener("click", (event) => {
        if (event.target === el.settingsModal) {
          closeSettings();
        }
      });
      el.themeSelect.addEventListener("change", (event) => {
        state.settings.theme = event.target.value;
        saveStorage(STORAGE_KEYS.settings, state.settings);
        applyTheme(state.settings.theme);
        renderSettingsButtons();
        renderGames();
      });
      el.soundToggleBtn.addEventListener("click", () => {
        state.settings.sound = !state.settings.sound;
        saveStorage(STORAGE_KEYS.settings, state.settings);
        renderSettingsButtons();
        playSound("beep");
      });
      el.hackBypassBtn.addEventListener("click", () => {
        state.settings.bypassHack = !state.settings.bypassHack;
        saveStorage(STORAGE_KEYS.settings, state.settings);
        renderSettingsButtons();
      });
      el.saveSettingsBtn.addEventListener("click", saveSettingsFromForm);
      el.testConnectionBtn.addEventListener("click", async () => {
        saveSettingsFromForm(false);
        el.settingsStatus.textContent = "TESTING HOME ASSISTANT LINK...";
        const ok = await fetchHomeAssistantStates();
        el.settingsStatus.textContent = ok ? "HOME ASSISTANT LINK ONLINE" : "HOME ASSISTANT LINK FAILED";
      });
      el.refreshDevicesBtn.addEventListener("click", async () => {
        playSound("click");
        await refreshDevicesAndAlerts(true);
      });
      el.inventorySearch.addEventListener("input", (event) => {
        state.inventorySearch = event.target.value.trim().toUpperCase();
        renderInventory();
      });
      el.barcodeLookupBtn.addEventListener("click", () => handleBarcodeLookup());
      el.barcodeFocusBtn.addEventListener("click", () => {
        el.barcodeInput.focus();
        el.barcodeStatus.textContent = "SCANNER ARMED";
        playSound("click");
      });
      el.barcodeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleBarcodeLookup();
        }
      });
      el.manualItemForm.addEventListener("submit", (event) => {
        event.preventDefault();
        addInventoryItem({
          name: el.manualName.value.trim(),
          quantity: Number(el.manualQty.value) || 1,
          category: el.manualCategory.value,
          notes: el.manualNotes.value.trim(),
          barcode: ""
        });
        el.manualItemForm.reset();
        el.manualQty.value = 1;
        el.manualCategory.value = state.inventoryCategory;
      });
      el.markAlertsReadBtn.addEventListener("click", () => {
        state.alerts = state.alerts.map((alert) => ({ ...alert, unread: false }));
        persistAlerts();
        renderAlerts();
        playSound("success");
      });
      el.regenHackBtn.addEventListener("click", () => {
        createHackGame();
        playSound("click");
      });
      el.hackHelpBtn.addEventListener("click", () => {
        appendHackLog("MATCH LETTERS IN THE CORRECT POSITIONS.");
        appendHackLog("CLICK BRACKET PAIRS TO REMOVE DUDS OR RESTORE ATTEMPTS.");
      });
      el.hackSettingsBtn.addEventListener("click", () => openSettings());
      el.exitGameBtn.addEventListener("click", exitGame);
      el.saveGameBtn.addEventListener("click", () => {
        if (state.activeGame && state.activeGame.serialize) {
          storeGameSave(state.activeGame.id, state.activeGame.serialize());
          renderSaves();
          playSound("success");
        }
      });
      window.addEventListener("keydown", (event) => {
        state.keys[event.key.toLowerCase()] = true;
        if (state.activeGame && state.activeGame.onKeyDown) {
          state.activeGame.onKeyDown(event);
        }
      });
      window.addEventListener("keyup", (event) => {
        state.keys[event.key.toLowerCase()] = false;
      });
      document.addEventListener("pointerdown", initAudioContext, { once: true });
    }

    function renderAll() {
      renderSettingsButtons();
      renderStat();
      renderInventory();
      renderAlerts();
      renderSaves();
      renderGames();
    }

    function renderTabs() {
      el.bottomTabs.textContent = "";
      TABS.forEach((tab) => {
        const button = document.createElement("button");
        button.className = "tab-btn" + (state.currentTab === tab.id ? " active" : "");
        button.textContent = tab.label;
        button.addEventListener("click", () => switchTab(tab.id));
        el.bottomTabs.appendChild(button);
      });
      setActivePanel(state.currentTab);
    }

    function switchTab(tabId) {
      state.currentTab = tabId;
      renderTabs();
      playSound("click");
    }

    function setActivePanel(tabId) {
      el.tabPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.tab === tabId);
      });
    }

    function renderInventorySubtabs() {
      el.inventorySubtabs.textContent = "";
      INVENTORY_CATEGORIES.forEach((category) => {
        const button = document.createElement("button");
        button.className = "subtab-btn" + (state.inventoryCategory === category.id ? " active" : "");
        button.textContent = category.label;
        button.addEventListener("click", () => {
          state.inventoryCategory = category.id;
          el.manualCategory.value = category.id;
          renderInventorySubtabs();
          renderInventory();
          playSound("click");
        });
        el.inventorySubtabs.appendChild(button);
      });
    }

    function openSettings() {
      el.settingsModal.classList.add("active");
      renderSettingsButtons();
      populateSettingsForm();
      playSound("click");
    }

    function closeSettings() {
      el.settingsModal.classList.remove("active");
    }

    function populateSettingsForm() {
      el.themeSelect.value = state.settings.theme;
      el.haUrlInput.value = state.settings.haUrl;
      el.haTokenInput.value = state.settings.haToken;
      renderSettingsButtons();
    }

    function renderSettingsButtons() {
      el.soundToggleBtn.textContent = "SOUND: " + (state.settings.sound ? "ON" : "OFF");
      el.soundToggleBtn.className = "toggle-btn" + (state.settings.sound ? " active" : " off");
      el.hackBypassBtn.textContent = "HACK BYPASS: " + (state.settings.bypassHack ? "ON" : "OFF");
      el.hackBypassBtn.className = "toggle-btn" + (state.settings.bypassHack ? " active" : " off");
      el.activeThemeLabel.textContent = "THEME: " + state.settings.theme.toUpperCase();
      if (state.settings.bypassHack) {
        el.hackOverlay.classList.remove("active");
      }
    }

    function saveSettingsFromForm(showMessage = true) {
      state.settings.haUrl = el.haUrlInput.value.trim().replace(/\/$/, "");
      state.settings.haToken = el.haTokenInput.value.trim();
      state.settings.theme = el.themeSelect.value;
      saveStorage(STORAGE_KEYS.settings, state.settings);
      applyTheme(state.settings.theme);
      if (showMessage) {
        el.settingsStatus.textContent = "SETTINGS SAVED";
        playSound("success");
      }
    }

    function applyTheme(themeName) {
      const theme = THEMES[themeName] || THEMES.green;
      const root = document.documentElement;
      root.style.setProperty("--bg", theme.bg);
      root.style.setProperty("--panel", theme.panel);
      root.style.setProperty("--panel-2", theme.panel2);
      root.style.setProperty("--text", theme.text);
      root.style.setProperty("--muted", theme.muted);
      root.style.setProperty("--line", hexToRgba(theme.text, 0.28));
      root.style.setProperty("--line-strong", hexToRgba(theme.text, 0.62));
      root.style.setProperty("--glow", theme.glow);
      el.topline.textContent = "LOCAL ACCESS NODE | " + themeName.toUpperCase() + " PROFILE";
      renderSettingsButtons();
    }

    function maybeShowHackScreen() {
      if (state.settings.bypassHack) {
        el.hackOverlay.classList.remove("active");
        return;
      }
      const last = localStorage.getItem("robco-last-login-game") || "hack";
      if (last === "hack") {
        localStorage.setItem("robco-last-login-game", "wire");
        createWireGame();
      } else {
        localStorage.setItem("robco-last-login-game", "hack");
        createHackGame();
      }
    }

    function createHackGame() {
      el.wireGameContent.classList.add("hidden");
      el.hackGameContent.classList.remove("hidden");
      el.attemptsSection.classList.remove("hidden");
      el.hackSubline.textContent = "ENTER PASSWORD NOW";
      const words = shuffle([
        "SECURITY", "OVERSEER", "WORKSHOP", "DELIVERY", "MONITORS", "OVERHAUL",
        "BACKROOM", "HARDWARE", "BASEMENT", "FREEZERS", "WARHEADS", "TERMINAL",
        "LOCKDOWN", "RADIATED", "GARRISON", "SENTINEL", "DEFENDER", "PROTOCOL",
        "MELTDOWN", "FALLBACK"
      ]).slice(0, 12);
      const password = words[Math.floor(Math.random() * words.length)];
      const chunks = buildHackDump(words, password);
      state.hackGame = {
        words,
        password,
        attempts: 4,
        logs: ["WELCOME TO ROBCO INDUSTRIES (TM) TERMLINK", "PASSWORD REQUIRED"],
        chunks,
        dudActions: {}
      };
      renderHackGame();
    }

    function buildHackDump(words) {
      const chars = "!@#$%^&*-+=/\\|?;:<>[]{}()";
      const length = 408;
      const buffer = Array.from({ length }, () => ({ type: "char", value: chars[Math.floor(Math.random() * chars.length)] }));
      const placements = [];
      words.forEach((word) => {
        let placed = false;
        for (let tries = 0; tries < 200 && !placed; tries += 1) {
          const start = Math.floor(Math.random() * (length - word.length));
          const overlaps = placements.some((entry) => !(start + word.length < entry.start || start > entry.end));
          if (!overlaps) {
            placements.push({ start, end: start + word.length - 1, word });
            for (let i = 0; i < word.length; i += 1) {
              buffer[start + i] = { type: "word", value: word, wordIndex: i };
            }
            placed = true;
          }
        }
      });
      const pairs = ["[]", "{}", "()"];
      for (let i = 0; i < 10; i += 1) {
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const len = Math.floor(Math.random() * 6) + 3;
        const start = Math.floor(Math.random() * (length - len - 1));
        if (buffer[start].type === "char" && buffer[start + len].type === "char") {
          buffer[start] = { type: "bracket", value: pair[0], pairId: "pair-" + i, pairStart: true };
          for (let j = 1; j < len; j += 1) {
            buffer[start + j] = { type: "char", value: chars[Math.floor(Math.random() * chars.length)] };
          }
          buffer[start + len] = { type: "bracket", value: pair[1], pairId: "pair-" + i, pairStart: false };
        }
      }
      return buffer;
    }

    function renderHackGame() {
      if (!state.hackGame) {
        return;
      }
      el.hackGrid.textContent = "";
      el.attemptsView.textContent = "";
      el.hackLog.textContent = "";
      for (let i = 0; i < 4; i += 1) {
        const block = document.createElement("div");
        block.className = "attempt-block" + (i >= state.hackGame.attempts ? " spent" : "");
        el.attemptsView.appendChild(block);
      }
      state.hackGame.logs.slice(-6).forEach((line) => appendHackLog(line, true));

      const perColumn = Math.ceil(state.hackGame.chunks.length / 2);
      const columns = [state.hackGame.chunks.slice(0, perColumn), state.hackGame.chunks.slice(perColumn)];
      columns.forEach((columnData, columnIndex) => {
        const column = document.createElement("div");
        column.className = "hack-column";
        for (let lineIdx = 0; lineIdx < Math.ceil(columnData.length / 12); lineIdx += 1) {
          const offset = lineIdx * 12;
          const row = columnData.slice(offset, offset + 12);
          const line = document.createElement("div");
          line.className = "hack-line";
          const address = document.createElement("span");
          address.className = "address";
          address.textContent = "0X" + (61440 + ((columnIndex * perColumn) + offset) * 2).toString(16).toUpperCase();
          const content = document.createElement("div");
          content.className = "hack-content";
          row.forEach((chunk, idx) => {
            const absoluteIndex = (columnIndex * perColumn) + offset + idx;
            if (chunk.type === "word" && chunk.wordIndex === 0) {
              const button = document.createElement("span");
              const alreadyGuessed = state.hackGame.logs.some((lineText) => lineText.includes(chunk.value + " ") || lineText.endsWith(chunk.value));
              button.className = "word-chip" + (alreadyGuessed ? " guessed" : "");
              button.textContent = chunk.value;
              button.addEventListener("click", () => chooseHackWord(chunk.value));
              content.appendChild(button);
            } else if (chunk.type === "word") {
              return;
            } else if (chunk.type === "bracket") {
              const token = document.createElement("span");
              token.className = "bracket-chip";
              token.textContent = chunk.value;
              token.addEventListener("click", () => handleBracketPair(chunk.pairId, absoluteIndex));
              content.appendChild(token);
            } else {
              const span = document.createElement("span");
              span.className = "char";
              span.textContent = chunk.value;
              content.appendChild(span);
            }
          });
          line.append(address, content);
          column.appendChild(line);
        }
        el.hackGrid.appendChild(column);
      });
    }

    function appendHackLog(line, silent = false) {
      if (!silent) {
        state.hackGame.logs.push(line);
      }
      const entry = document.createElement("div");
      entry.textContent = line;
      el.hackLog.appendChild(entry);
    }

    function chooseHackWord(word) {
      if (!state.hackGame || state.hackGame.attempts <= 0) {
        return;
      }
      playSound("beep");
      if (word === state.hackGame.password) {
        state.hackGame.logs.push(word);
        state.hackGame.logs.push("> ACCESS GRANTED");
        renderHackGame();
        playSound("success");
        setTimeout(() => el.hackOverlay.classList.remove("active"), 300);
        return;
      }
      state.hackGame.attempts -= 1;
      const likeness = getLikeness(word, state.hackGame.password);
      state.hackGame.logs.push(word);
      state.hackGame.logs.push("> ENTRY DENIED");
      state.hackGame.logs.push("> LIKENESS=" + likeness);
      if (state.hackGame.attempts <= 0) {
        state.hackGame.logs.push("> TERMINAL LOCKED");
        playSound("error");
        renderHackGame();
        setTimeout(createHackGame, 1200);
        return;
      }
      renderHackGame();
    }

    function handleBracketPair(pairId) {
      if (!state.hackGame || state.hackGame.dudActions[pairId]) {
        return;
      }
      state.hackGame.dudActions[pairId] = true;
      const canRestore = Math.random() > 0.5 && state.hackGame.attempts < 4;
      if (canRestore) {
        state.hackGame.attempts += 1;
        state.hackGame.logs.push("> DUD REMOVED? NEGATIVE");
        state.hackGame.logs.push("> ATTEMPTS RESET");
        playSound("success");
      } else {
        const dudWords = state.hackGame.words.filter((word) => word !== state.hackGame.password);
        const removeWord = dudWords[Math.floor(Math.random() * dudWords.length)];
        state.hackGame.chunks = state.hackGame.chunks.map((chunk) => {
          if (chunk.type === "word" && chunk.value === removeWord) {
            return { type: "char", value: "." };
          }
          return chunk;
        });
        state.hackGame.logs.push("> DUD REMOVED");
        playSound("click");
      }
      renderHackGame();
    }

    function getLikeness(word, password) {
      let likeness = 0;
      for (let i = 0; i < Math.min(word.length, password.length); i += 1) {
        if (word[i] === password[i]) {
          likeness += 1;
        }
      }
      return likeness;
    }

    // ---- Wire Puzzle (Conduit Alignment) ----
    const WIRE_SIZE = 4;
    const WIRE_DIRS = [
      { bit: 1, dr: -1, dc: 0, opp: 4 },
      { bit: 2, dr: 0,  dc: 1, opp: 8 },
      { bit: 4, dr: 1,  dc: 0, opp: 1 },
      { bit: 8, dr: 0,  dc: -1, opp: 2 }
    ];

    function wireRotateMask(mask) {
      let out = 0;
      if (mask & 1) out |= 2;
      if (mask & 2) out |= 4;
      if (mask & 4) out |= 8;
      if (mask & 8) out |= 1;
      return out;
    }

    function wireGenerate() {
      const n = WIRE_SIZE * WIRE_SIZE;
      const cells = Array.from({ length: n }, () => ({ solved: 0, current: 0 }));
      const visited = new Array(n).fill(false);
      const idx = (r, c) => r * WIRE_SIZE + c;
      function dfs(r, c) {
        visited[idx(r, c)] = true;
        const dirs = shuffle([...WIRE_DIRS]);
        for (const d of dirs) {
          const nr = r + d.dr;
          const nc = c + d.dc;
          if (nr >= 0 && nr < WIRE_SIZE && nc >= 0 && nc < WIRE_SIZE && !visited[idx(nr, nc)]) {
            cells[idx(r, c)].solved |= d.bit;
            cells[idx(nr, nc)].solved |= d.opp;
            dfs(nr, nc);
          }
        }
      }
      dfs(0, 0);
      cells.forEach((cell) => {
        const rotations = Math.floor(Math.random() * 4);
        cell.current = cell.solved;
        for (let i = 0; i < rotations; i++) cell.current = wireRotateMask(cell.current);
      });
      return cells;
    }

    function wireComputePower(cells) {
      const powered = new Set([0]);
      const queue = [0];
      const idx = (r, c) => r * WIRE_SIZE + c;
      while (queue.length) {
        const i = queue.shift();
        const r = Math.floor(i / WIRE_SIZE);
        const c = i % WIRE_SIZE;
        for (const d of WIRE_DIRS) {
          const nr = r + d.dr;
          const nc = c + d.dc;
          if (nr < 0 || nr >= WIRE_SIZE || nc < 0 || nc >= WIRE_SIZE) continue;
          const ni = idx(nr, nc);
          if (powered.has(ni)) continue;
          if ((cells[i].current & d.bit) && (cells[ni].current & d.opp)) {
            powered.add(ni);
            queue.push(ni);
          }
        }
      }
      return powered;
    }

    function createWireGame() {
      if (state.wireGame && state.wireGame._listening) {
        el.wireCanvas.removeEventListener("click", wireHandleClick);
        el.wireCanvas.removeEventListener("touchend", wireHandleTap);
      }
      el.hackGameContent.classList.add("hidden");
      el.wireGameContent.classList.remove("hidden");
      el.attemptsSection.classList.add("hidden");
      el.hackSubline.textContent = "CONDUIT ALIGNMENT REQUIRED";
      state.wireGame = { cells: wireGenerate(), won: false, _listening: true };
      el.wireCanvas.addEventListener("click", wireHandleClick);
      el.wireCanvas.addEventListener("touchend", wireHandleTap);
      requestAnimationFrame(renderWireGame);
    }

    function renderWireGame() {
      const powered = wireComputePower(state.wireGame.cells);
      const won = powered.size === WIRE_SIZE * WIRE_SIZE;
      state.wireGame.won = won;
      const total = WIRE_SIZE * WIRE_SIZE;
      el.wireStatus.textContent = won ? "ALL CONDUITS ACTIVE" : powered.size + " / " + total + " NODES POWERED";
      el.wireStatus.className = "wire-status" + (won ? " wire-powered" : "");
      drawWireCanvas(powered, won);
      if (won) {
        playSound("success");
        setTimeout(() => {
          el.wireGameContent.classList.add("hidden");
          el.hackOverlay.classList.remove("active");
          el.wireCanvas.removeEventListener("click", wireHandleClick);
          el.wireCanvas.removeEventListener("touchend", wireHandleTap);
          state.wireGame = null;
        }, 900);
      }
    }

    function drawWireCanvas(powered, won) {
      const canvas = el.wireCanvas;
      const size = Math.round(canvas.getBoundingClientRect().width) || 320;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const cellSize = size / WIRE_SIZE;
      const half = cellSize / 2;
      const pipeW = Math.max(4, Math.round(cellSize * 0.2));
      const themeColors = {
        green: { bg: "#0a1a0a", dim: "#112211", pipe: "#20c20e", glow: "#20c20e", source: "#f9a825" },
        amber: { bg: "#1a1200", dim: "#261a00", pipe: "#ffb300", glow: "#ffb300", source: "#f9a825" },
        blue:  { bg: "#050e1a", dim: "#0a152a", pipe: "#2288ff", glow: "#22ddff", source: "#f9a825" },
        red:   { bg: "#1a0505", dim: "#2a0808", pipe: "#ff3333", glow: "#ff6600", source: "#f9a825" }
      };
      const col = themeColors[state.settings.theme] || themeColors.green;
      ctx.clearRect(0, 0, size, size);

      for (let r = 0; r < WIRE_SIZE; r++) {
        for (let c = 0; c < WIRE_SIZE; c++) {
          const i = r * WIRE_SIZE + c;
          const cx = c * cellSize;
          const cy = r * cellSize;
          const isPowered = powered.has(i);
          const isSource = i === 0;
          const mask = state.wireGame.cells[i].current;

          ctx.fillStyle = isPowered ? col.dim : col.bg;
          ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize - 1, cellSize - 1);

          const pipeColor = isSource ? col.source : (isPowered ? col.pipe : "rgba(255,255,255,0.18)");

          if (isPowered || isSource) {
            ctx.shadowColor = isSource ? col.source : col.glow;
            ctx.shadowBlur = 10;
          }

          ctx.strokeStyle = pipeColor;
          ctx.lineWidth = pipeW;
          ctx.lineCap = "square";
          ctx.beginPath();
          if (mask & 1) { ctx.moveTo(cx + half, cy + half); ctx.lineTo(cx + half, cy + 2); }
          if (mask & 2) { ctx.moveTo(cx + half, cy + half); ctx.lineTo(cx + cellSize - 2, cy + half); }
          if (mask & 4) { ctx.moveTo(cx + half, cy + half); ctx.lineTo(cx + half, cy + cellSize - 2); }
          if (mask & 8) { ctx.moveTo(cx + half, cy + half); ctx.lineTo(cx + 2, cy + half); }
          ctx.stroke();

          ctx.fillStyle = pipeColor;
          ctx.fillRect(cx + half - pipeW / 2, cy + half - pipeW / 2, pipeW, pipeW);

          ctx.shadowBlur = 0;

          if (isSource) {
            ctx.strokeStyle = col.source;
            ctx.lineWidth = 2;
            ctx.shadowColor = col.source;
            ctx.shadowBlur = 6;
            ctx.strokeRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8);
            ctx.shadowBlur = 0;
          }
        }
      }

      if (won) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, size, size);
        ctx.shadowColor = col.glow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = col.pipe;
        ctx.font = "bold " + Math.round(size / 9) + "px 'Share Tech Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ACCESS GRANTED", size / 2, size / 2);
        ctx.shadowBlur = 0;
      }
    }

    function wireHandleClick(e) {
      e.preventDefault();
      const rect = el.wireCanvas.getBoundingClientRect();
      wireTapAt(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    }

    function wireHandleTap(e) {
      e.preventDefault();
      if (!e.changedTouches.length) return;
      const t = e.changedTouches[0];
      const rect = el.wireCanvas.getBoundingClientRect();
      wireTapAt(t.clientX - rect.left, t.clientY - rect.top, rect.width, rect.height);
    }

    function wireTapAt(x, y, w, h) {
      if (!state.wireGame || state.wireGame.won) return;
      const c = Math.floor((x / w) * WIRE_SIZE);
      const r = Math.floor((y / h) * WIRE_SIZE);
      if (r < 0 || r >= WIRE_SIZE || c < 0 || c >= WIRE_SIZE) return;
      state.wireGame.cells[r * WIRE_SIZE + c].current = wireRotateMask(state.wireGame.cells[r * WIRE_SIZE + c].current);
      playSound("click");
      renderWireGame();
    }

    async function startPolling() {
      await refreshDevicesAndAlerts(false);
      setInterval(() => refreshDevicesAndAlerts(false), 30000);
    }
