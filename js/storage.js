const STORAGE_SCHEMA_VERSION = 1;

function loadStorage(key, fallback, migrate = defaultStorageMigrate) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return structuredClone(fallback);
    }
    const parsed = JSON.parse(raw);
    const wrapped = parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "__schemaVersion") && Object.prototype.hasOwnProperty.call(parsed, "data");
    const version = wrapped ? parsed.__schemaVersion : 0;
    const payload = wrapped ? parsed.data : parsed;
    return migrate(payload, version, fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify({
    __schemaVersion: STORAGE_SCHEMA_VERSION,
    data: value
  }));
}

function defaultStorageMigrate(value, _version, fallback) {
  return value == null ? structuredClone(fallback) : value;
}

function migrateSettings(value, _version, fallback) {
  const next = { ...structuredClone(fallback) };
  if (!value || typeof value !== "object") {
    return next;
  }
  if (typeof value.theme === "string") {
    next.theme = value.theme;
  }
  if (typeof value.sound === "boolean") {
    next.sound = value.sound;
  }
  if (typeof value.bypassHack === "boolean") {
    next.bypassHack = value.bypassHack;
  }
  if (typeof value.haUrl === "string") {
    next.haUrl = value.haUrl.trim().replace(/\/$/, "");
  }
  if (typeof value.haToken === "string") {
    next.haToken = value.haToken.trim();
  }
  return next;
}

function migrateInventory(value, _version, fallback) {
  if (!Array.isArray(value)) {
    return structuredClone(fallback);
  }
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
      name: String(item.name || "UNKNOWN ITEM").trim().toUpperCase(),
      quantity: Math.max(1, Number(item.quantity) || 1),
      category: normalizeInventoryCategory(item.category),
      notes: typeof item.notes === "string" ? item.notes : "",
      barcode: typeof item.barcode === "string" ? item.barcode : "",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
    }));
}

function migrateAlerts(value, _version, fallback) {
  if (!Array.isArray(value)) {
    return structuredClone(fallback);
  }
  return value
    .filter((alert) => alert && typeof alert === "object")
    .map((alert) => ({
      id: typeof alert.id === "string" ? alert.id : crypto.randomUUID(),
      timestamp: alert.timestamp || new Date().toISOString(),
      source: String(alert.source || "SYSTEM"),
      type: String(alert.type || "EVENT"),
      detail: typeof alert.detail === "string" ? alert.detail : "",
      unread: Boolean(alert.unread)
    }))
    .slice(0, 30);
}

function migrateSaves(value, _version, fallback) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return structuredClone(fallback);
  }
  return Object.fromEntries(Object.entries(value)
    .filter(([key, entry]) => typeof key === "string" && entry && typeof entry === "object")
    .map(([key, entry]) => [key, {
      savedAt: entry.savedAt || new Date().toISOString(),
      summary: String(entry.summary || "SAVE DATA"),
      data: entry.data ?? null
    }]));
}

function migrateHighscores(value, _version, fallback) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return structuredClone(fallback);
  }
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => typeof key === "string")
    .map(([key, score]) => [key, Math.max(0, Math.floor(Number(score) || 0))]));
}

function normalizeInventoryCategory(value) {
  return ["food", "supplies", "tools"].includes(value) ? value : "supplies";
}
