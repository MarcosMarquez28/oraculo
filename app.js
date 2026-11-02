"use strict";

const STORAGE_KEYS = {
  baseCapital: "oraculo.baseCapital",
  trades: "oraculo.trades",
  withdrawals: "oraculo.withdrawals",
  discordRadarWebhook: "oraculo.discordRadarWebhook",
  discordFuturesWebhook: "oraculo.discordFuturesWebhook",
  legacyDiscordWebhook: "oraculo.discordWebhook",
};

const TRADE_PATTERNS = [
  "Agotamiento de vela (Amague)",
  "Martillo (Rechazo comprador)",
  "Martillo Invertido (Rechazo vendedor)",
  "Doji (Indecisión)",
  "Vela Envolvente (Fuerza)",
  "Equal Highs (Doble Techo / Resistencia)",
  "Equal Lows (Doble Piso / Soporte)",
  "Order Block (OB)",
  "Imbalance / Ineficiencia",
  "BOS (Quiebre con Cuerpo)",
  "OB + Imbalance + BOS",
  "CHoCH (Cambio de Carácter) + POI",
  "Order Block Decisional",
  "Order Block Extremo",
  "Rebote Directo en POI",
  "Soporte 15m",
  "Resistencia clave",
  "Ruptura (Breakout)",
];

const PATTERN_GUIDES = {
  "Martillo (Rechazo comprador)":
    "Probabilidad orientativa de éxito: 50-60% según la clase. Busca confirmación en una zona de soporte o resistencia.",
  "Martillo Invertido (Rechazo vendedor)":
    "Probabilidad orientativa de éxito: 50-60% según la clase. Busca confirmación en una zona de soporte o resistencia.",
  "Doji (Indecisión)":
    "Probabilidad orientativa de éxito: 50-60% según la clase. Busca confirmación en una zona de soporte o resistencia.",
  "Vela Envolvente (Fuerza)":
    "Probabilidad orientativa de éxito: 50-60% según la clase. Busca confirmación en una zona de soporte o resistencia.",
  "BOS (Quiebre con Cuerpo)":
    "Validación institucional: El quiebre debe confirmarse con el cuerpo de la vela, no con una simple mecha.",
  "CHoCH (Cambio de Carácter) + POI":
    "Regla SMC: El CHoCH debe confirmarse preferiblemente con el cuerpo de la vela rompiendo un nivel clave dentro de un POI.",
};

const DAILY_TRADE_LIMIT = 3;
const SESSION_TRADE_LIMIT = 2;
const FUTURES_MINIMUM_SCORE = 80;
const DISCORD_ALERT_THRESHOLD = 80;
const MARKET_ORDER_TYPE = "Orden de Mercado (Entrada inmediata)";
const SMART_MONEY_REMINDER =
  "Filosofía Smart Money: Menos indicadores saturados, más enfoque en estructura, Order Blocks y gestión estricta del riesgo.";
const EXECUTION_REMINDER =
  "Regla de Ejecución: Si entraste a mercado, verifica el precio real promedio de ejecución antes de fijar tus salidas con órdenes de protección.";

const elements = {
  currentMonth: document.getElementById("current-month"),
  sessionTradeCount: document.getElementById("session-trade-count"),
  sessionTradeLabel: document.getElementById("session-trade-label"),
  sessionTradeTrack: document.querySelector(".session-trade-track"),
  sessionTradeFill: document.getElementById("session-trade-fill"),
  sessionTradeAlert: document.getElementById("session-trade-alert"),
  currentCapital: document.getElementById("current-capital"),
  totalWithdrawals: document.getElementById("total-withdrawals"),
  withdrawalWorkingCapital: document.getElementById("withdrawal-working-capital"),
  withdrawalAvailableProfit: document.getElementById("withdrawal-available-profit"),
  withdrawalForm: document.getElementById("withdrawal-form"),
  withdrawalAmount: document.getElementById("withdrawal-amount"),
  withdrawalDestination: document.getElementById("withdrawal-destination"),
  withdrawalError: document.getElementById("withdrawal-error"),
  withdrawalList: document.getElementById("withdrawal-list"),
  withdrawalEmpty: document.getElementById("withdrawal-empty"),
  monthlyPnl: document.getElementById("monthly-pnl"),
  winRate: document.getElementById("win-rate"),
  tradeCount: document.getElementById("trade-count"),
  goalProgressLabel: document.getElementById("goal-progress-label"),
  goalProgressTrack: document.getElementById("goal-progress-track"),
  goalProgressFill: document.getElementById("goal-progress-fill"),
  goalMonthlyPnl: document.getElementById("goal-monthly-pnl"),
  goalTarget: document.getElementById("goal-target"),
  baseCapitalInput: document.getElementById("base-capital"),
  capitalForm: document.getElementById("capital-form"),
  capitalError: document.getElementById("capital-error"),
  capitalSaved: document.getElementById("capital-saved"),
  riskForm: document.getElementById("risk-form"),
  riskDirection: document.getElementById("trade-direction"),
  entryPrice: document.getElementById("entry-price"),
  takeProfit: document.getElementById("take-profit"),
  stopLoss: document.getElementById("stop-loss"),
  riskPercent: document.getElementById("risk-percent"),
  riskSmcReminder: document.getElementById("risk-smc-reminder"),
  executionReminder: document.getElementById("execution-reminder"),
  riskResults: document.getElementById("risk-results"),
  takeProfitPrice: document.getElementById("take-profit-price"),
  stopLossPrice: document.getElementById("stop-loss-price"),
  riskAmount: document.getElementById("risk-amount"),
  riskRangeAlert: document.getElementById("risk-range-alert"),
  riskError: document.getElementById("risk-error"),
  tradeForm: document.getElementById("trade-form"),
  tradePair: document.getElementById("trade-pair"),
  tradePnl: document.getElementById("trade-pnl"),
  tradePattern: document.getElementById("trade-pattern"),
  tradeStructure: document.getElementById("trade-structure"),
  tradeStyle: document.getElementById("trade-style"),
  tradeEmotion: document.getElementById("trade-emotion"),
  tradePlanRespected: document.getElementById("trade-plan-respected"),
  tradeNewsContext: document.getElementById("trade-news-context"),
  tradeExecutionType: document.getElementById("trade-execution-type"),
  marketOcoField: document.getElementById("market-oco-field"),
  tradeMarketOco: document.getElementById("trade-market-oco"),
  tradeNewAsset: document.getElementById("trade-new-asset"),
  fundamentalChecklist: document.getElementById("fundamental-checklist"),
  fundamentalUtility: document.getElementById("fundamental-utility"),
  fundamentalSupply: document.getElementById("fundamental-supply"),
  fundamentalNetwork: document.getElementById("fundamental-network"),
  patternGuide: document.getElementById("pattern-guide"),
  tradeNotes: document.getElementById("trade-notes"),
  tradeError: document.getElementById("trade-error"),
  tradeList: document.getElementById("trade-list"),
  patternStats: document.getElementById("pattern-stats"),
  patternEmpty: document.getElementById("pattern-empty"),
  cooldownAlert: document.getElementById("cooldown-alert"),
  logTradeCount: document.getElementById("log-trade-count"),
  emptyState: document.getElementById("empty-state"),
  storageError: document.getElementById("storage-error"),
  dailyTradeAlert: document.getElementById("daily-trade-alert"),
  marketSession: document.getElementById("market-session"),
  radarForm: document.getElementById("radar-form"),
  radarSymbol: document.getElementById("radar-symbol"),
  radarTimeframe: document.getElementById("radar-timeframe"),
  radarSubmit: document.getElementById("radar-submit"),
  radarSimulationDirection: document.getElementById("radar-simulation-direction"),
  radarSimulate: document.getElementById("radar-simulate"),
  radarStatus: document.getElementById("radar-status"),
  radarChart: document.getElementById("radar-chart"),
  radarChartTitle: document.getElementById("radar-chart-title"),
  radarChartSubtitle: document.getElementById("radar-chart-subtitle"),
  radarChartSvg: document.getElementById("radar-chart-svg"),
  radarChartLegend: document.getElementById("radar-chart-legend"),
  radarChartGuidance: document.getElementById("radar-chart-guidance"),
  radarChartReadout: document.getElementById("radar-chart-readout"),
  radarResults: document.getElementById("radar-results"),
  radarMarketLabel: document.getElementById("radar-market-label"),
  radarDirection: document.getElementById("radar-direction"),
  radarProbability: document.getElementById("radar-probability"),
  radarSampleSize: document.getElementById("radar-sample-size"),
  radarEntryZone: document.getElementById("radar-entry-zone"),
  radarStopLoss: document.getElementById("radar-stop-loss"),
  radarTakeProfit: document.getElementById("radar-take-profit"),
  radarExtension: document.getElementById("radar-extension"),
  radarProjection: document.getElementById("radar-projection"),
  radarPatternTitle: document.getElementById("radar-pattern-title"),
  radarPatternExplanation: document.getElementById("radar-pattern-explanation"),
  futuresForm: document.getElementById("futures-form"),
  futuresSymbol: document.getElementById("futures-symbol"),
  futuresTimeframe: document.getElementById("futures-timeframe"),
  futuresSubmit: document.getElementById("futures-submit"),
  futuresStatus: document.getElementById("futures-status"),
  futuresSignal: document.getElementById("futures-signal"),
  futuresMarketLabel: document.getElementById("futures-market-label"),
  futuresDirection: document.getElementById("futures-direction"),
  futuresScore: document.getElementById("futures-score"),
  futuresScoreDetail: document.getElementById("futures-score-detail"),
  futuresEntry: document.getElementById("futures-entry"),
  futuresStop: document.getElementById("futures-stop"),
  futuresTakeProfit: document.getElementById("futures-take-profit"),
  futuresStopDistance: document.getElementById("futures-stop-distance"),
  futuresLeverageNote: document.getElementById("futures-leverage-note"),
  futuresChart: document.getElementById("futures-chart"),
  futuresChartTitle: document.getElementById("futures-chart-title"),
  futuresChartSubtitle: document.getElementById("futures-chart-subtitle"),
  futuresChartSvg: document.getElementById("futures-chart-svg"),
  futuresChartLegend: document.getElementById("futures-chart-legend"),
  futuresChartGuidance: document.getElementById("futures-chart-guidance"),
  futuresChartReadout: document.getElementById("futures-chart-readout"),
  discordRadarWebhookForm: document.getElementById("discord-radar-webhook-form"),
  discordRadarWebhookInput: document.getElementById("discord-radar-webhook-url"),
  discordRadarWebhookTest: document.getElementById("discord-radar-webhook-test"),
  discordRadarWebhookStatus: document.getElementById("discord-radar-webhook-status"),
  discordFuturesWebhookForm: document.getElementById("discord-futures-webhook-form"),
  discordFuturesWebhookInput: document.getElementById("discord-futures-webhook-url"),
  discordFuturesWebhookTest: document.getElementById("discord-futures-webhook-test"),
  discordFuturesWebhookStatus: document.getElementById("discord-futures-webhook-status"),
};

const radarChartView = {
  root: elements.radarChart,
  title: elements.radarChartTitle,
  subtitle: elements.radarChartSubtitle,
  svg: elements.radarChartSvg,
  legend: elements.radarChartLegend,
  guidance: elements.radarChartGuidance,
  readout: elements.radarChartReadout,
};
const futuresChartView = {
  root: elements.futuresChart,
  title: elements.futuresChartTitle,
  subtitle: elements.futuresChartSubtitle,
  svg: elements.futuresChartSvg,
  legend: elements.futuresChartLegend,
  guidance: elements.futuresChartGuidance,
  readout: elements.futuresChartReadout,
};

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const priceFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const radarPriceFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

let baseCapital = loadBaseCapital();
let trades = loadTrades();
let withdrawals = loadWithdrawals();
let discordRadarWebhookUrl = loadDiscordWebhook(
  STORAGE_KEYS.discordRadarWebhook,
  elements.discordRadarWebhookStatus,
  true,
);
let discordFuturesWebhookUrl = loadDiscordWebhook(
  STORAGE_KEYS.discordFuturesWebhook,
  elements.discordFuturesWebhookStatus,
  false,
);
let activeMarketSession = null;
let latestRadarSignal = null;
let latestMarketSnapshot = null;
elements.discordRadarWebhookInput.value = discordRadarWebhookUrl;
elements.discordFuturesWebhookInput.value = discordFuturesWebhookUrl;
if (!elements.discordRadarWebhookStatus.textContent) {
  elements.discordRadarWebhookStatus.textContent = discordRadarWebhookUrl
    ? "Webhook de Radar General guardado en este navegador."
    : "No hay webhook configurado para el Radar General.";
}
if (!elements.discordFuturesWebhookStatus.textContent) {
  elements.discordFuturesWebhookStatus.textContent = discordFuturesWebhookUrl
    ? "Webhook de Francotirador guardado en este navegador."
    : "No hay webhook configurado para el Francotirador.";
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function getLocalMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLocalDateKey(date) {
  return `${getLocalMonthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCurrentCapital() {
  return (
    baseCapital +
    trades.reduce((total, trade) => total + trade.pnl, 0) -
    withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0)
  );
}

function getTotalWithdrawals() {
  return withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
}

function getAvailableProfitForWithdrawal() {
  const totalPnl = trades.reduce((total, trade) => total + trade.pnl, 0);
  return Math.max(0, totalPnl - getTotalWithdrawals());
}

function getTodayTradeCount() {
  const todayKey = getLocalDateKey(new Date());
  return trades.filter((trade) => getLocalDateKey(new Date(trade.date)) === todayKey).length;
}

function getMarketSession(date) {
  const markets = [
    { name: "Tokio", timeZone: "Asia/Tokyo", open: 9, close: 18 },
    { name: "Londres", timeZone: "Europe/London", open: 8, close: 17, killzoneEnd: 11 },
    {
      name: "Nueva York",
      timeZone: "America/New_York",
      open: 8,
      close: 17,
      killzoneEnd: 11,
    },
  ];
  const marketTimes = markets.map((market) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: market.timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const isOpen = hour >= market.open && hour < market.close;

    return {
      ...market,
      isOpen,
      isKillzone: isOpen && market.killzoneEnd !== undefined && hour < market.killzoneEnd,
    };
  });
  const currentMarket =
    marketTimes.find((market) => market.name === "Nueva York" && market.isKillzone) ||
    marketTimes.find((market) => market.name === "Londres" && market.isKillzone) ||
    marketTimes.find((market) => market.isOpen);

  return currentMarket || { name: "Fuera de sesión", isKillzone: false };
}

function updateMarketSession() {
  const now = new Date();
  const currentMarket = getMarketSession(now);
  activeMarketSession = currentMarket.name;
  elements.marketSession.textContent = currentMarket
    ? `${currentMarket.name}${currentMarket.isKillzone ? " · Killzone" : ""}`
    : "Fuera de sesión";
  elements.marketSession.classList.toggle("is-killzone", Boolean(currentMarket?.isKillzone));
  elements.marketSession.setAttribute(
    "aria-label",
    currentMarket.name !== "Fuera de sesión"
      ? `Sesión actual: ${currentMarket.name}${currentMarket.isKillzone ? ", Killzone" : ""}`
      : "Fuera de las sesiones de Tokio, Londres y Nueva York",
  );
  renderSessionTradeCount(now);
}

function getTradeSession(trade) {
  return trade.marketSession || getMarketSession(new Date(trade.date)).name;
}

function getSessionTradeCount(date, sessionName) {
  const localDateKey = getLocalDateKey(date);
  return trades.filter(
    (trade) =>
      getLocalDateKey(new Date(trade.date)) === localDateKey &&
      getTradeSession(trade) === sessionName,
  ).length;
}

function renderSessionTradeCount(date = new Date()) {
  const sessionName = activeMarketSession || getMarketSession(date).name;
  const tradeCount = getSessionTradeCount(date, sessionName);
  const progress = Math.min(tradeCount, SESSION_TRADE_LIMIT);

  elements.sessionTradeCount.textContent = `${tradeCount} de ${SESSION_TRADE_LIMIT} operaciones`;
  elements.sessionTradeLabel.textContent = sessionName;
  elements.sessionTradeTrack.setAttribute("aria-valuenow", String(progress));
  elements.sessionTradeFill.style.width = `${(progress / SESSION_TRADE_LIMIT) * 100}%`;
  elements.sessionTradeAlert.hidden = tradeCount < SESSION_TRADE_LIMIT;
}

function setSignedClass(element, value) {
  element.classList.toggle("positive-text", value > 0);
  element.classList.toggle("negative-text", value < 0);
}

function showStorageError(message) {
  elements.storageError.textContent = message;
}

function validateDiscordWebhookUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Ingresa una URL válida del webhook de Discord.");
  }
  if (
    url.protocol !== "https:" ||
    !["discord.com", "discordapp.com"].includes(url.hostname.toLowerCase()) ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(url.pathname)
  ) {
    throw new Error("La URL debe ser un webhook HTTPS válido de discord.com.");
  }
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.href;
}

function loadDiscordWebhook(storageKey, statusElement, allowLegacyMigration) {
  try {
    let storedUrl = localStorage.getItem(storageKey);
    if (!storedUrl && allowLegacyMigration) {
      storedUrl = localStorage.getItem(STORAGE_KEYS.legacyDiscordWebhook);
      if (storedUrl) {
        const migratedUrl = validateDiscordWebhookUrl(storedUrl);
        localStorage.setItem(storageKey, migratedUrl);
        localStorage.removeItem(STORAGE_KEYS.legacyDiscordWebhook);
        return migratedUrl;
      }
    }
    if (!storedUrl) {
      return "";
    }
    return validateDiscordWebhookUrl(storedUrl);
  } catch (error) {
    statusElement.textContent =
      `No se pudo cargar el webhook guardado: ${error.message}`;
    return "";
  }
}

function saveDiscordWebhook(value, storageKey, statusElement) {
  try {
    if (!value) {
      localStorage.removeItem(storageKey);
      return true;
    }
    const validatedUrl = validateDiscordWebhookUrl(value);
    localStorage.setItem(storageKey, validatedUrl);
    return true;
  } catch (error) {
    statusElement.textContent =
      `No se pudo guardar el webhook: ${error.message}`;
    return false;
  }
}

function loadBaseCapital() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.baseCapital);
    if (storedValue === null) {
      return 0;
    }

    const parsedValue = Number(storedValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new Error("El capital base guardado no es válido.");
    }

    return parsedValue;
  } catch (error) {
    showStorageError(`No se pudo leer el capital guardado: ${error.message}`);
    return 0;
  }
}

function loadTrades() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.trades);
    if (storedValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every(
        (trade) =>
          trade &&
          typeof trade.id === "string" &&
          typeof trade.pair === "string" &&
          Number.isFinite(trade.pnl) &&
          (trade.pattern === undefined || typeof trade.pattern === "string") &&
          (trade.structure === undefined || typeof trade.structure === "string") &&
          (trade.style === undefined || typeof trade.style === "string") &&
          (trade.emotion === undefined || typeof trade.emotion === "string") &&
          (trade.planRespected === undefined || typeof trade.planRespected === "boolean") &&
          (trade.newsContext === undefined || typeof trade.newsContext === "string") &&
          (trade.executionType === undefined || typeof trade.executionType === "string") &&
          (trade.marketOcoConfirmed === undefined ||
            typeof trade.marketOcoConfirmed === "boolean") &&
          (trade.marketSession === undefined || typeof trade.marketSession === "string") &&
          (trade.isNewAsset === undefined || typeof trade.isNewAsset === "boolean") &&
          (trade.fundamentalChecks === undefined ||
            (trade.fundamentalChecks &&
              typeof trade.fundamentalChecks === "object" &&
              typeof trade.fundamentalChecks.utility === "boolean" &&
              typeof trade.fundamentalChecks.supply === "boolean" &&
              typeof trade.fundamentalChecks.network === "boolean")) &&
          typeof trade.notes === "string" &&
          typeof trade.date === "string" &&
          !Number.isNaN(Date.parse(trade.date)),
      )
    ) {
      throw new Error("El historial guardado no tiene un formato válido.");
    }

    return parsedValue;
  } catch (error) {
    showStorageError(`No se pudo leer el historial guardado: ${error.message}`);
    return [];
  }
}

function loadWithdrawals() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.withdrawals);
    if (storedValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every(
        (withdrawal) =>
          withdrawal &&
          typeof withdrawal.id === "string" &&
          Number.isFinite(withdrawal.amount) &&
          withdrawal.amount > 0 &&
          typeof withdrawal.destination === "string" &&
          typeof withdrawal.date === "string" &&
          !Number.isNaN(Date.parse(withdrawal.date)),
      )
    ) {
      throw new Error("El historial de retiros guardado no tiene un formato válido.");
    }

    return parsedValue;
  } catch (error) {
    showStorageError(`No se pudo leer el historial de retiros: ${error.message}`);
    return [];
  }
}

function saveBaseCapital(value) {
  try {
    localStorage.setItem(STORAGE_KEYS.baseCapital, String(value));
    baseCapital = value;
    return true;
  } catch (error) {
    showStorageError(`No se pudo guardar el capital base: ${error.message}`);
    return false;
  }
}

function saveWithdrawals(nextWithdrawals) {
  try {
    localStorage.setItem(STORAGE_KEYS.withdrawals, JSON.stringify(nextWithdrawals));
    withdrawals = nextWithdrawals;
    return true;
  } catch (error) {
    showStorageError(`No se pudo guardar el historial de retiros: ${error.message}`);
    return false;
  }
}

function saveTrades(nextTrades) {
  try {
    localStorage.setItem(STORAGE_KEYS.trades, JSON.stringify(nextTrades));
    trades = nextTrades;
    return true;
  } catch (error) {
    showStorageError(`No se pudo guardar el historial: ${error.message}`);
    return false;
  }
}

function renderDashboard() {
  const now = new Date();
  const currentMonthKey = getLocalMonthKey(now);
  const currentMonthTrades = trades.filter(
    (trade) => getLocalMonthKey(new Date(trade.date)) === currentMonthKey,
  );
  const totalPnl = trades.reduce((total, trade) => total + trade.pnl, 0);
  const monthlyPnl = currentMonthTrades.reduce((total, trade) => total + trade.pnl, 0);
  const closedTrades = trades.filter((trade) => trade.pnl !== 0);
  const winningTrades = closedTrades.filter((trade) => trade.pnl > 0).length;
  const winRate = closedTrades.length === 0 ? 0 : (winningTrades / closedTrades.length) * 100;
  const currentCapital = getCurrentCapital();
  const monthlyTarget = baseCapital * 0.15;
  const progress = monthlyTarget > 0 ? (monthlyPnl / monthlyTarget) * 100 : 0;
  const displayedProgress = Math.max(0, Math.min(100, progress));

  elements.currentMonth.textContent = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(now);
  elements.currentCapital.textContent = formatCurrency(currentCapital);
  setSignedClass(elements.currentCapital, currentCapital - baseCapital);
  elements.totalWithdrawals.textContent = formatCurrency(getTotalWithdrawals());
  elements.withdrawalWorkingCapital.textContent = formatCurrency(currentCapital);
  elements.withdrawalAvailableProfit.textContent = formatCurrency(getAvailableProfitForWithdrawal());
  elements.monthlyPnl.textContent = formatCurrency(monthlyPnl);
  setSignedClass(elements.monthlyPnl, monthlyPnl);
  elements.winRate.textContent = `${winRate.toFixed(1)}%`;
  elements.tradeCount.textContent = `${closedTrades.length} operaciones cerradas`;
  elements.goalProgressLabel.textContent = `${Math.max(0, progress).toFixed(1)}%`;
  elements.goalProgressTrack.setAttribute("aria-valuenow", displayedProgress.toFixed(1));
  elements.goalProgressFill.style.width = `${displayedProgress}%`;
  elements.goalMonthlyPnl.textContent = `${formatCurrency(monthlyPnl)} este mes`;
  elements.goalTarget.textContent = formatCurrency(monthlyTarget);
  elements.baseCapitalInput.value = baseCapital > 0 ? String(baseCapital) : "";

  renderTrades();
  renderWithdrawals();
  renderPatternStats();
  renderCooldownAlert();
  renderDailyTradeAlert();
  renderSessionTradeCount();
  if (latestRadarSignal) {
    renderRadarSignal(latestRadarSignal);
  }
  if (!elements.riskResults.hidden) {
    updateRiskAssessment();
  }
}

function formatRadarPrice(value) {
  return `${radarPriceFormatter.format(value)} USDT`;
}

function getHistoricalSuccessEstimate() {
  const closedTrades = trades.filter((trade) => trade.pnl !== 0);
  const wins = closedTrades.filter((trade) => trade.pnl > 0).length;
  return {
    percentage: ((wins + 2) / (closedTrades.length + 4)) * 100,
    sampleSize: closedTrades.length,
  };
}

function createDiscordSignalEmbed(signal, details) {
  const isLong = signal.direction === 1;
  const scoreField = details.type === "futures"
    ? {
        name: "Puntaje de confluencia",
        value: `${details.score}/100`,
        inline: true,
      }
    : {
        name: "Estimación del diario",
        value: `${details.score.toFixed(1)}% · ${details.sampleSize} operaciones cerradas`,
        inline: true,
      };
  return {
    title: `Oráculo · ALERTA ${isLong ? "LONG" : "SHORT"} · ${details.symbol}`,
    description:
      "Señal detectada en velas cerradas. Espera el retroceso a la zona POI / Order Block; " +
      "no persigas el precio ni tomes esta alerta como una orden.",
    color: isLong ? 0x27d99a : 0xff657a,
    fields: [
      { name: "Par", value: details.symbol, inline: true },
      { name: "Temporalidad", value: details.timeframe, inline: true },
      scoreField,
      {
        name: "Zona POI · Order Block",
        value: `${formatRadarPrice(signal.entryLow)} – ${formatRadarPrice(signal.entryHigh)}`,
        inline: false,
      },
      { name: "Stop Loss · invalidez", value: formatRadarPrice(signal.stopLoss), inline: true },
      {
        name: "Take Profit conservador",
        value: formatRadarPrice(signal.takeProfit),
        inline: true,
      },
    ],
    footer: { text: `${details.market} · Oráculo no ejecuta órdenes` },
    timestamp: new Date().toISOString(),
  };
}

async function sendDiscordEmbed(embed, webhookUrl, purpose, statusElement) {
  if (!webhookUrl) {
    statusElement.textContent = "Configura y guarda la URL de este canal para recibir alertas.";
    return false;
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 10_000);
  statusElement.textContent = `${purpose}: enviando mensaje a Discord…`;
  try {
    const response = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) {
      throw new Error(`Discord respondió con estado ${response.status}. Verifica el webhook y vuelve a probar.`);
    }
    statusElement.textContent = `${purpose}: Discord confirmó la recepción del mensaje.`;
    return true;
  } catch (error) {
    const message = controller.signal.aborted
      ? "La solicitud a Discord superó 10 segundos; inténtalo nuevamente."
      : error instanceof TypeError
        ? "No se pudo conectar con Discord. Comprueba la red y las restricciones de CORS."
        : error.message;
    statusElement.textContent = `${purpose}: ${message}`;
    return false;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function sendDiscordSignal(signal, details, webhookUrl, statusElement) {
  if (!webhookUrl) {
    return;
  }
  void sendDiscordEmbed(
    createDiscordSignalEmbed(signal, details),
    webhookUrl,
    "Alerta automática",
    statusElement,
  );
}

function normalizeCandle(candle) {
  const values = Array.isArray(candle)
    ? {
        time: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        closeTime: candle[6],
      }
    : candle;
  if (!values || typeof values !== "object") {
    return null;
  }

  const open = Number(values.open);
  const high = Number(values.high);
  const low = Number(values.low);
  const close = Number(values.close);
  if (
    ![open, high, low, close].every(Number.isFinite) ||
    low <= 0 ||
    high < Math.max(open, close) ||
    low > Math.min(open, close)
  ) {
    return null;
  }

  const time = Number(values.time ?? values.timestamp ?? 0);
  const closeTime = values.closeTime === undefined ? undefined : Number(values.closeTime);
  if (!Number.isFinite(time) || (closeTime !== undefined && !Number.isFinite(closeTime))) {
    return null;
  }

  const isClosed =
    typeof values.isClosed === "boolean"
      ? values.isClosed
      : closeTime === undefined
        ? undefined
        : closeTime < Date.now();
  return { time, open, high, low, close, closeTime, isClosed };
}

function analyzeOpportunity(candles) {
  const hasClosureMetadata = candles.some((candle) => candle.isClosed !== undefined);
  const closedCandles = hasClosureMetadata
    ? candles.filter((candle) => candle.isClosed !== false)
    : candles.slice(0, -1);
  if (closedCandles.length < 22) {
    return { reason: "Se necesitan al menos 22 velas cerradas para evaluar estructura e impulso." };
  }

  const impulseIndex = closedCandles.length - 1;
  const impulse = closedCandles[impulseIndex];
  const referenceBodies = closedCandles
    .slice(impulseIndex - 20, impulseIndex)
    .map((candle) => Math.abs(candle.close - candle.open))
    .sort((first, second) => first - second);
  const medianBody = (referenceBodies[9] + referenceBodies[10]) / 2;
  const impulseBody = Math.abs(impulse.close - impulse.open);
  if (medianBody <= 0 || impulseBody < medianBody * 1.5 || impulse.close === impulse.open) {
    return { reason: "No se detectó un impulso confirmado con suficiente fuerza en la última vela cerrada." };
  }

  const direction = impulse.close > impulse.open ? 1 : -1;
  const structureStart = Math.max(0, impulseIndex - 14);
  const structureCandles = closedCandles.slice(structureStart, impulseIndex - 3);
  if (structureCandles.length < 3) {
    return { reason: "Aún no hay suficientes velas previas para confirmar un cambio de estructura." };
  }

  const structureBoundary =
    direction === 1
      ? Math.max(...structureCandles.map((candle) => candle.high))
      : Math.min(...structureCandles.map((candle) => candle.low));
  const confirmsStructure =
    direction === 1 ? impulse.close > structureBoundary : impulse.close < structureBoundary;
  if (!confirmsStructure) {
    return { reason: "Hay movimiento, pero el cierre no confirmó un cambio de estructura (CHoCH)." };
  }

  let orderBlock = null;
  let orderBlockIndex = -1;
  for (let index = impulseIndex - 1; index >= Math.max(0, impulseIndex - 10); index -= 1) {
    const candle = closedCandles[index];
    const isOpposingCandle =
      direction === 1 ? candle.close < candle.open : candle.close > candle.open;
    if (isOpposingCandle) {
      orderBlock = candle;
      orderBlockIndex = index;
      break;
    }
  }
  if (!orderBlock) {
    return { reason: "Se confirmó el impulso, pero no se encontró una vela contraria para delimitar el POI." };
  }

  const candleTwoBack = closedCandles[impulseIndex - 2];
  const hasImbalance =
    direction === 1
      ? impulse.low > candleTwoBack.high
      : impulse.high < candleTwoBack.low;
  const entryLow = orderBlock.low;
  const entryHigh = orderBlock.high;
  const orderBlockRange = orderBlock.high - orderBlock.low;
  const orderBlockBodyRatio =
    orderBlockRange > 0
      ? Math.abs(orderBlock.close - orderBlock.open) / orderBlockRange
      : 0;
  const orderBlockBarsAgo = impulseIndex - orderBlockIndex;
  const entry = (entryLow + entryHigh) / 2;
  const zoneBuffer = Math.max(entryHigh - entryLow, entry * 0.0001) * 0.1;
  const stopLoss = direction === 1 ? entryLow - zoneBuffer : entryHigh + zoneBuffer;
  const riskDistance = Math.abs(entry - stopLoss);
  const takeProfit = direction === 1
    ? Math.max(entry + riskDistance * 1.5, impulse.close + impulseBody * 0.25)
    : Math.min(entry - riskDistance * 1.5, impulse.close - impulseBody * 0.25);
  const extension = takeProfit + direction * impulseBody * 0.618;

  return {
    direction,
    entryLow,
    entryHigh,
    orderBlockIndex,
    orderBlockBodyRatio,
    orderBlockBarsAgo,
    impulseBodyRatio: medianBody > 0 ? impulseBody / medianBody : 0,
    stopLoss,
    takeProfit,
    extension,
    structureBoundary,
    hasImbalance,
  };
}

function analyzeFuturesSetup(candles, timeframe) {
  if (!["1h", "4h"].includes(timeframe)) {
    return {
      active: false,
      score: 0,
      reason: "El modo francotirador solo admite temporalidades de 1h y 4h.",
    };
  }

  const setup = analyzeOpportunity(candles);
  if (!setup.direction) {
    return { ...setup, active: false, score: 0 };
  }

  const clearOrderBlock =
    setup.orderBlockBodyRatio >= 0.35 && setup.orderBlockBarsAgo <= 5;
  const entry = (setup.entryLow + setup.entryHigh) / 2;
  const riskDistance = Math.abs(entry - setup.stopLoss);
  const rewardDistance = Math.abs(setup.takeProfit - entry);
  const rewardRiskRatio = riskDistance > 0 ? rewardDistance / riskDistance : 0;
  const impulseStrengthScore = Math.min(
    20,
    Math.max(0, ((setup.impulseBodyRatio - 1.5) / 1.5) * 20),
  );
  const score = Math.round(
    35 +
      (clearOrderBlock ? 25 : 0) +
      (setup.hasImbalance ? 15 : 0) +
      impulseStrengthScore +
      (rewardRiskRatio >= 1.5 ? 5 : 0),
  );
  const active =
    clearOrderBlock &&
    setup.impulseBodyRatio >= 1.5 &&
    score >= FUTURES_MINIMUM_SCORE;

  return {
    ...setup,
    active,
    clearOrderBlock,
    impulseStrengthScore,
    rewardRiskRatio,
    score,
    minimumScore: FUTURES_MINIMUM_SCORE,
    reason: active
      ? ""
      : !clearOrderBlock
        ? "El Order Block no cumple los criterios de claridad del filtro."
        : score < FUTURES_MINIMUM_SCORE
          ? `La confluencia obtuvo ${score}/100; el filtro exige al menos ${FUTURES_MINIMUM_SCORE}/100.`
          : "El impulso no alcanza la fuerza mínima del filtro.",
  };
}

function analyzeFuturesCandles(candles, timeframe) {
  if (!Array.isArray(candles) || candles.length < 2) {
    throw new Error("Los datos de futuros deben incluir al menos dos velas.");
  }
  const normalizedCandles = candles.map(normalizeCandle);
  if (normalizedCandles.some((candle) => candle === null)) {
    throw new Error("Una o más velas de futuros tienen valores OHLC inválidos.");
  }
  return analyzeFuturesSetup(normalizedCandles, timeframe);
}

function renderFuturesRest(reason = "") {
  elements.futuresSignal.hidden = true;
  elements.futuresStatus.textContent =
    "Modo Francotirador Activo: Esperando configuración de alta probabilidad. Sin ruido." +
    (reason ? ` ${reason}` : "");
  elements.futuresStatus.classList.remove("futures-status-active");
}

function renderFuturesSignal(setup, metadata) {
  const entry = (setup.entryLow + setup.entryHigh) / 2;
  const stopDistancePercent = (Math.abs(entry - setup.stopLoss) / entry) * 100;
  const onePercentRiskLeverage = stopDistancePercent > 0 ? 1 / stopDistancePercent : 0;
  elements.futuresMarketLabel.textContent = `${metadata.symbol} · ${metadata.timeframe} · Binance USDⓈ-M`;
  elements.futuresDirection.textContent = setup.direction === 1 ? "🟢 Alcista" : "🔴 Bajista";
  elements.futuresDirection.classList.toggle("is-bullish", setup.direction === 1);
  elements.futuresDirection.classList.toggle("is-bearish", setup.direction === -1);
  elements.futuresScore.textContent = `${setup.score}/100`;
  elements.futuresScoreDetail.textContent =
    `Filtro superado · CHoCH + OB claro · ${setup.hasImbalance ? "con imbalance" : "sin imbalance"}`;
  elements.futuresEntry.textContent =
    `${formatRadarPrice(setup.entryLow)} – ${formatRadarPrice(setup.entryHigh)}`;
  elements.futuresStop.textContent = formatRadarPrice(setup.stopLoss);
  elements.futuresTakeProfit.textContent = formatRadarPrice(setup.takeProfit);
  elements.futuresStopDistance.textContent = `${stopDistancePercent.toFixed(2)}% desde el centro del POI`;
  elements.futuresLeverageNote.textContent =
    `Control de riesgo: stop a ${stopDistancePercent.toFixed(2)}% del punto medio del POI. ` +
    `Como referencia matemática, arriesgar como máximo 1% del capital usando el 100% como margen equivaldría a ≤${onePercentRiskLeverage.toFixed(2)}× ` +
    "de nocional. No es una recomendación de apalancamiento; reduce tamaño y considera gaps, comisiones y liquidación.";
  elements.futuresSignal.hidden = false;
  elements.futuresStatus.textContent =
    "Configuración de alta confluencia detectada en vela cerrada. Revisa el plan y el riesgo; no se envían órdenes.";
  elements.futuresStatus.classList.add("futures-status-active");
}

function receiveFuturesCandles(candles, metadata = {}) {
  if (!metadata || typeof metadata !== "object") {
    throw new Error("Los metadatos de futuros deben ser un objeto.");
  }
  if (!Array.isArray(candles) || candles.length < 2) {
    throw new Error("Los datos de futuros deben incluir al menos dos velas.");
  }
  const normalizedCandles = candles.map(normalizeCandle);
  if (normalizedCandles.some((candle) => candle === null)) {
    throw new Error("Una o más velas de futuros tienen valores OHLC inválidos.");
  }
  const setup = analyzeFuturesCandles(normalizedCandles, metadata.timeframe);
  const chartMetadata = {
    symbol: metadata.symbol || "Mercado",
    timeframe: metadata.timeframe || "Temporalidad no indicada",
    source: metadata.source || "Binance USDⓈ-M Futures",
  };
  if (!setup.active || metadata.isSimulation === true) {
    const reason = metadata.isSimulation === true
      ? "Las velas sintéticas no pueden activar señales de futuros."
      : setup.reason;
    renderFuturesRest(reason);
    renderRadarChart(
      normalizedCandles,
      null,
      chartMetadata,
      futuresChartView,
      `MODO DE ESPERA · ${reason || "Sin configuración confirmada."} El gráfico muestra velas limpias, sin niveles de entrada o salida.`,
    );
    return { ...setup, active: false };
  }
  renderFuturesSignal(setup, {
    symbol: chartMetadata.symbol,
    timeframe: chartMetadata.timeframe,
  });
  renderRadarChart(normalizedCandles, setup, chartMetadata, futuresChartView);
  if (
    metadata.isSimulation !== true &&
    setup.score >= DISCORD_ALERT_THRESHOLD &&
    discordFuturesWebhookUrl
  ) {
    sendDiscordSignal(setup, {
      type: "futures",
      score: setup.score,
      symbol: chartMetadata.symbol,
      timeframe: chartMetadata.timeframe,
      market: "Binance USDⓈ-M Futures",
    }, discordFuturesWebhookUrl, elements.discordFuturesWebhookStatus);
  }
  return setup;
}

function renderRadarSignal(signal) {
  const estimate = getHistoricalSuccessEstimate();
  const directionName = signal.direction === 1 ? "🟢 Alcista" : "🔴 Bajista";
  elements.radarDirection.textContent = directionName;
  elements.radarDirection.classList.toggle("is-bullish", signal.direction === 1);
  elements.radarDirection.classList.toggle("is-bearish", signal.direction === -1);
  elements.radarMarketLabel.textContent = `${signal.symbol} · ${signal.timeframe} · ${signal.source}`;
  elements.radarProbability.textContent = `${estimate.percentage.toFixed(1)}%`;
  elements.radarSampleSize.textContent =
    estimate.sampleSize === 0
      ? "Base neutral · aún sin operaciones cerradas"
      : `Diario: ${estimate.sampleSize} operaciones cerradas`;
  elements.radarEntryZone.textContent =
    `${formatRadarPrice(signal.entryLow)} – ${formatRadarPrice(signal.entryHigh)}`;
  elements.radarStopLoss.textContent = formatRadarPrice(signal.stopLoss);
  elements.radarTakeProfit.textContent = formatRadarPrice(signal.takeProfit);
  elements.radarExtension.textContent = formatRadarPrice(signal.extension);
  elements.radarProjection.textContent =
    `Hay probabilidad de que ${signal.direction === 1 ? "suba" : "baje"} hasta ${formatRadarPrice(signal.extension)}, ` +
    `pero la toma de ganancia conservadora de referencia es ${formatRadarPrice(signal.takeProfit)}.`;
  elements.radarPatternTitle.textContent = signal.hasImbalance
    ? "CHoCH + Order Block + imbalance detectados"
    : "CHoCH + Order Block detectados";
  elements.radarPatternExplanation.textContent =
    `El cierre de la vela de impulso ${signal.direction === 1 ? "superó" : "perdió"} ` +
    `${formatRadarPrice(signal.structureBoundary)}, confirmando un cambio de estructura (CHoCH). ` +
    `La última vela contraria define el Order Block / POI; ${signal.hasImbalance ? "también hay un desequilibrio (FVG) entre velas." : "no se observó un FVG en las tres velas evaluadas."} ` +
    "La zona marcada corresponde al rango de esa vela; espera el retroceso y confirma el contexto antes de decidir.";
  elements.radarResults.hidden = false;
}

function createRadarSvgElement(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  return element;
}

function renderRadarChart(candles, signal, metadata, chartView = radarChartView, guidanceText) {
  const visibleCandles = candles.slice(-80);
  const width = 1080;
  const height = 420;
  const plot = { left: 18, right: 824, top: 24, bottom: 354 };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const firstVisibleIndex = candles.length - visibleCandles.length;
  const prices = visibleCandles.flatMap((candle) => [candle.high, candle.low]);
  let minPrice = Math.min(...prices);
  let maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.08 || maxPrice * 0.002;
  minPrice -= padding;
  maxPrice += padding;
  const yForPrice = (price) => plot.bottom - ((price - minPrice) / (maxPrice - minPrice)) * plotHeight;
  const xForIndex = (index) =>
    plot.left +
    ((index - firstVisibleIndex) / Math.max(visibleCandles.length - 1, 1)) * plotWidth;
  const svg = chartView.svg;
  svg.replaceChildren();

  const chartTitle = createRadarSvgElement("title");
  chartTitle.textContent = `Velas ${metadata.symbol} · ${metadata.timeframe}`;
  const chartDescription = createRadarSvgElement("desc");
  chartDescription.textContent = signal
    ? `Gráfico con ${visibleCandles.length} velas y zonas marcadas para POI, stop loss, take profit y extensión.`
    : `Gráfico de ${visibleCandles.length} velas. No se detectó una configuración confirmada.`;
  svg.append(chartTitle, chartDescription);
  svg.setAttribute(
    "aria-label",
    `Velas de ${metadata.symbol} en ${metadata.timeframe}${signal ? ", con niveles de entrada y salida" : ""}`,
  );

  svg.append(
    createRadarSvgElement("rect", {
      x: "0",
      y: "0",
      width,
      height,
      rx: "8",
      class: "radar-chart-background",
    }),
  );

  for (let tick = 0; tick <= 4; tick += 1) {
    const y = plot.top + (plotHeight / 4) * tick;
    const price = maxPrice - ((maxPrice - minPrice) / 4) * tick;
    svg.append(
      createRadarSvgElement("line", {
        x1: plot.left,
        x2: plot.right,
        y1: y,
        y2: y,
        class: "radar-chart-gridline",
      }),
    );
    const axisLabel = createRadarSvgElement("text", {
      x: plot.right + 8,
      y: y + 4,
      class: "radar-chart-axis-label",
    });
    axisLabel.textContent = radarPriceFormatter.format(price);
    svg.append(axisLabel);
  }

  if (signal) {
    const orderBlockX = xForIndex(signal.orderBlockIndex);
    const zoneTop = yForPrice(signal.entryHigh);
    const zoneBottom = yForPrice(signal.entryLow);
    svg.append(
      createRadarSvgElement("rect", {
        x: orderBlockX,
        y: zoneTop,
        width: Math.max(1, plot.right - orderBlockX),
        height: Math.max(1, zoneBottom - zoneTop),
        class: signal.direction === 1 ? "radar-chart-poi-bullish" : "radar-chart-poi-bearish",
      }),
    );

  }

  const candleSpacing = plotWidth / Math.max(visibleCandles.length - 1, 1);
  const candleWidth = Math.max(3, Math.min(9, candleSpacing * 0.66));
  visibleCandles.forEach((candle, visibleIndex) => {
    const originalIndex = firstVisibleIndex + visibleIndex;
    const x = xForIndex(originalIndex);
    const isBullish = candle.close > candle.open;
    const isBearish = candle.close < candle.open;
    const candleClass = isBullish
      ? "radar-chart-candle-bullish"
      : isBearish
        ? "radar-chart-candle-bearish"
        : "radar-chart-candle-neutral";
    const group = createRadarSvgElement("g", {
      class: `radar-chart-candle ${candleClass}`,
      tabindex: "0",
      role: "img",
      "aria-label": `Vela ${formatRadarCandleTime(candle.time)}. Apertura ${formatRadarPrice(candle.open)}, máximo ${formatRadarPrice(candle.high)}, mínimo ${formatRadarPrice(candle.low)}, cierre ${formatRadarPrice(candle.close)}.`,
    });
    const title = createRadarSvgElement("title");
    title.textContent =
      `${formatRadarCandleTime(candle.time)} · ` +
      `O ${formatRadarPrice(candle.open)} · H ${formatRadarPrice(candle.high)} · ` +
      `L ${formatRadarPrice(candle.low)} · C ${formatRadarPrice(candle.close)}`;
    group.append(title);
    group.append(
      createRadarSvgElement("line", {
        x1: x,
        x2: x,
        y1: yForPrice(candle.high),
        y2: yForPrice(candle.low),
        class: "radar-chart-wick",
      }),
      createRadarSvgElement("rect", {
        x: x - candleWidth / 2,
        y: Math.min(yForPrice(candle.open), yForPrice(candle.close)),
        width: candleWidth,
        height: Math.max(1.5, Math.abs(yForPrice(candle.open) - yForPrice(candle.close))),
        rx: "0.8",
        class: "radar-chart-body",
      }),
    );
    const updateReadout = () => {
      chartView.readout.textContent = title.textContent;
    };
    group.addEventListener("pointerenter", updateReadout);
    group.addEventListener("focus", updateReadout);
    svg.append(group);
  });

  if (signal) {
    const levels = [
      { price: signal.stopLoss, label: "STOP", className: "radar-chart-stop" },
      { price: signal.takeProfit, label: "TP CONSERVADOR", className: "radar-chart-take-profit" },
      { price: signal.extension, label: "EXTENSIÓN", className: "radar-chart-extension" },
    ];
    for (const level of levels) {
      const isOutsideScale = level.price < minPrice || level.price > maxPrice;
      const y = Math.max(plot.top, Math.min(plot.bottom, yForPrice(level.price)));
      if (isOutsideScale) {
        const edgeMarker = createRadarSvgElement("path", {
          d: level.price > maxPrice
            ? `M ${plot.right - 5} ${y + 5} L ${plot.right} ${y - 5} L ${plot.right + 5} ${y + 5} Z`
            : `M ${plot.right - 5} ${y - 5} L ${plot.right} ${y + 5} L ${plot.right + 5} ${y - 5} Z`,
          class: `radar-chart-edge-marker ${level.className}`,
        });
        svg.append(edgeMarker);
      } else {
        svg.append(
          createRadarSvgElement("line", {
          x1: plot.left,
          x2: plot.right,
          y1: y,
          y2: y,
          class: `radar-chart-level ${level.className}`,
          }),
        );
      }
    }

  }

  for (let tick = 0; tick <= 4; tick += 1) {
    const candleIndex = Math.round(
      firstVisibleIndex + ((visibleCandles.length - 1) / 4) * tick,
    );
    const x = xForIndex(candleIndex);
    const timeLabel = createRadarSvgElement("text", {
      x,
      y: plot.bottom + 27,
      "text-anchor": tick === 0 ? "start" : tick === 4 ? "end" : "middle",
      class: "radar-chart-time-label",
    });
    timeLabel.textContent = formatRadarCandleTime(candles[candleIndex]?.time);
    svg.append(timeLabel);
  }

  chartView.title.textContent = `${metadata.symbol} · velas ${metadata.timeframe}`;
  chartView.subtitle.textContent = `${visibleCandles.length} velas recientes · fuente ${metadata.source}`;
  chartView.legend.replaceChildren();
  const legendItems = [
    { label: "Vela alcista", className: "radar-legend-bullish" },
    { label: "Vela bajista", className: "radar-legend-bearish" },
  ];
  if (signal) {
    const levelItems = [
      {
        label: "Entrada · POI / Order Block",
        value: `${radarPriceFormatter.format(signal.entryLow)} – ${radarPriceFormatter.format(signal.entryHigh)} USDT`,
        className: signal.direction === 1 ? "radar-legend-poi-bullish" : "radar-legend-poi-bearish",
        price: (signal.entryLow + signal.entryHigh) / 2,
      },
      {
        label: "Stop · invalidez",
        value: `${radarPriceFormatter.format(signal.stopLoss)} USDT`,
        className: "radar-legend-stop",
        price: signal.stopLoss,
      },
      {
        label: "Take Profit conservador",
        value: `${radarPriceFormatter.format(signal.takeProfit)} USDT`,
        className: "radar-legend-take-profit",
        price: signal.takeProfit,
      },
      {
        label: "Extensión proyectada",
        value: `${radarPriceFormatter.format(signal.extension)} USDT`,
        className: "radar-legend-extension",
        price: signal.extension,
      },
    ];
    legendItems.push(...levelItems.map((item) => ({
      ...item,
      value: `${item.value}${item.price < minPrice || item.price > maxPrice ? " · fuera de escala" : ""}`,
    })));
  }
  for (const item of legendItems) {
    const legendItem = document.createElement("span");
    legendItem.className = "radar-chart-legend-item";
    const swatch = document.createElement("span");
    swatch.className = `radar-chart-swatch ${item.className}`;
    swatch.setAttribute("aria-hidden", "true");
    const legendText = document.createElement("span");
    legendText.className = "radar-chart-legend-text";
    const label = document.createElement("span");
    label.textContent = item.label;
    legendText.append(label);
    if (item.value) {
      const value = document.createElement("strong");
      value.textContent = item.value;
      legendText.append(value);
    }
    legendItem.append(swatch, legendText);
    chartView.legend.append(legendItem);
  }
  chartView.guidance.hidden = !signal && !guidanceText;
  chartView.guidance.textContent = signal
    ? "ESPERA EL RETROCESO A LA ZONA POI · No persigas el precio; confirma el contexto antes de decidir."
    : guidanceText || "";
  chartView.readout.textContent =
    "Selecciona una vela para consultar apertura, máximo, mínimo y cierre.";
  chartView.root.hidden = false;
}

function formatRadarCandleTime(timestamp) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Hora no disponible";
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function receiveLiveCandles(candles, metadata = {}) {
  if (!Array.isArray(candles) || candles.length < 2) {
    throw new Error("Los datos deben incluir al menos dos velas.");
  }
  if (!metadata || typeof metadata !== "object") {
    throw new Error("Los metadatos de mercado deben ser un objeto.");
  }

  const normalizedCandles = candles.map(normalizeCandle);
  if (normalizedCandles.some((candle) => candle === null)) {
    throw new Error("Una o más velas tienen valores OHLC inválidos.");
  }

  const result = analyzeOpportunity(normalizedCandles);
  const marketMetadata = {
    symbol: metadata.symbol || "Mercado",
    timeframe: metadata.timeframe || "Temporalidad no indicada",
    source: metadata.source || "Datos recibidos",
    isSimulation: metadata.isSimulation === true,
  };
  if (!result.direction) {
    latestRadarSignal = null;
    elements.radarResults.hidden = true;
    renderRadarChart(normalizedCandles, null, marketMetadata);
    elements.radarStatus.textContent = marketMetadata.isSimulation
      ? `Simulación local: ${result.reason}`
      : result.reason;
    return null;
  }

  latestRadarSignal = {
    ...result,
    ...marketMetadata,
  };
  renderRadarChart(normalizedCandles, latestRadarSignal, marketMetadata);
  elements.radarStatus.textContent = marketMetadata.isSimulation
    ? "SIMULACIÓN LOCAL · Escenario sintético para probar la interfaz; no es una cotización ni una señal de mercado."
    : "Impulso confirmado en velas cerradas. La alerta es orientativa; espera el posible retroceso a la zona POI.";
  renderRadarSignal(latestRadarSignal);
  if (!marketMetadata.isSimulation && discordRadarWebhookUrl) {
    const estimate = getHistoricalSuccessEstimate();
    sendDiscordSignal(latestRadarSignal, {
      type: "radar",
      score: estimate.percentage,
      sampleSize: estimate.sampleSize,
      symbol: marketMetadata.symbol,
      timeframe: marketMetadata.timeframe,
      market: marketMetadata.source,
    }, discordRadarWebhookUrl, elements.discordRadarWebhookStatus);
  }
  return latestRadarSignal;
}

function buildSimulationCandles(direction, basePrice, timeframe) {
  if (!["bullish", "bearish"].includes(direction)) {
    throw new Error("Selecciona un escenario alcista o bajista.");
  }
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error("No se puede crear un escenario con una referencia de precio inválida.");
  }

  const intervalMilliseconds = {
    "5m": 5 * 60_000,
    "15m": 15 * 60_000,
    "1h": 60 * 60_000,
    "4h": 4 * 60 * 60_000,
  }[timeframe];
  if (!intervalMilliseconds) {
    throw new Error("La temporalidad de la simulación no es compatible.");
  }

  const directionSign = direction === "bullish" ? 1 : -1;
  const tick = basePrice * 0.00005;
  const currentIntervalStart = Math.floor(Date.now() / intervalMilliseconds) * intervalMilliseconds;
  const candles = [];
  for (let index = 0; index < 31; index += 1) {
    const time = currentIntervalStart - (30 - index) * intervalMilliseconds;
    const offset = Math.sin(index * 1.7) * tick * 0.5;
    let open = basePrice + offset;
    let close = open + (index % 2 === 0 ? 1 : -1) * tick * 0.45;
    let high = Math.max(open, close) + tick * 0.5;
    let low = Math.min(open, close) - tick * 0.5;

    if (index === 28) {
      open = basePrice + directionSign * tick * 2;
      close = basePrice - directionSign * tick * 3;
      high = Math.max(open, close) + tick * 0.3;
      low = Math.min(open, close) - tick * 0.5;
    } else if (index === 29) {
      open = basePrice + directionSign * tick * 4;
      close = basePrice + directionSign * basePrice * 0.006;
      high =
        directionSign === 1
          ? close + basePrice * 0.001
          : open + tick * 0.2;
      low =
        directionSign === 1
          ? open - tick * 0.2
          : close - basePrice * 0.001;
    } else if (index === 30) {
      open = basePrice + directionSign * basePrice * 0.006;
      close = open + directionSign * tick * 0.25;
      high = Math.max(open, close) + tick * 0.3;
      low = Math.min(open, close) - tick * 0.3;
    }

    candles.push({
      time,
      open,
      high,
      low,
      close,
      isClosed: index < 30,
    });
  }
  return candles;
}

async function requestBinanceKlines(endpoint, marketLabel) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `Binance ${marketLabel} respondió con estado ${response.status}. Verifica el par y vuelve a intentar.`,
      );
    }

    const payload = await response.json();
    if (
      !Array.isArray(payload) ||
      !payload.every((candle) => Array.isArray(candle) && candle.length >= 7)
    ) {
      throw new Error(`La respuesta de Binance ${marketLabel} no contiene velas válidas.`);
    }

    return payload.map((candle) => ({
      time: Number(candle[0]),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      closeTime: Number(candle[6]),
      isClosed: Number(candle[6]) < Date.now(),
    }));
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`La consulta a Binance ${marketLabel} superó 10 segundos; inténtalo nuevamente.`);
    }
    if (error instanceof TypeError) {
      throw new Error(
        `No se pudo conectar con la API pública de Binance ${marketLabel}. Comprueba la red o posibles restricciones de CORS.`,
      );
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function validateBinanceMarketRequest(symbol, timeframe, allowedTimeframes) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  if (!/^[A-Z0-9]{5,20}$/.test(normalizedSymbol)) {
    throw new Error("Usa el símbolo del mercado sin separadores, por ejemplo BTCUSDT.");
  }
  if (!allowedTimeframes.includes(timeframe)) {
    throw new Error(`La temporalidad debe ser ${allowedTimeframes.join(" o ")}.`);
  }
  return normalizedSymbol;
}

async function fetchBinanceCandles(symbol, timeframe) {
  const normalizedSymbol = validateBinanceMarketRequest(symbol, timeframe, ["5m", "15m", "1h", "4h"]);
  const endpoint = new URL("https://api.binance.com/api/v3/klines");
  endpoint.searchParams.set("symbol", normalizedSymbol);
  endpoint.searchParams.set("interval", timeframe);
  endpoint.searchParams.set("limit", "100");
  return requestBinanceKlines(endpoint, "Spot");
}

async function fetchBinanceFuturesCandles(symbol, timeframe) {
  const normalizedSymbol = validateBinanceMarketRequest(symbol, timeframe, ["1h", "4h"]);
  const endpoint = new URL("https://fapi.binance.com/fapi/v1/klines");
  endpoint.searchParams.set("symbol", normalizedSymbol);
  endpoint.searchParams.set("interval", timeframe);
  endpoint.searchParams.set("limit", "100");
  return requestBinanceKlines(endpoint, "USDⓈ-M Futures");
}

function renderWithdrawals() {
  elements.withdrawalList.replaceChildren();
  elements.withdrawalEmpty.hidden = withdrawals.length > 0;

  for (const withdrawal of [...withdrawals].sort(
    (first, second) => Date.parse(second.date) - Date.parse(first.date),
  )) {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const destinationCell = document.createElement("td");
    const amountCell = document.createElement("td");

    dateCell.className = "trade-date";
    dateCell.textContent = dateFormatter.format(new Date(withdrawal.date));
    destinationCell.textContent = withdrawal.destination || "Billetera externa";
    amountCell.className = "trade-pnl negative-text";
    amountCell.textContent = `−${formatCurrency(withdrawal.amount)}`;
    row.append(dateCell, destinationCell, amountCell);
    elements.withdrawalList.append(row);
  }
}

function renderDailyTradeAlert() {
  elements.dailyTradeAlert.hidden = getTodayTradeCount() < DAILY_TRADE_LIMIT;
}

function renderPatternStats() {
  elements.patternStats.replaceChildren();

  const patterns = new Set(TRADE_PATTERNS);
  for (const trade of trades) {
    patterns.add(trade.pattern?.trim() || "Sin categoría");
  }

  for (const pattern of patterns) {
    const patternTrades = trades.filter(
      (trade) => (trade.pattern?.trim() || "Sin categoría") === pattern,
    );
    const closedTrades = patternTrades.filter((trade) => trade.pnl !== 0);
    const wins = closedTrades.filter((trade) => trade.pnl > 0).length;
    const winRate = closedTrades.length === 0 ? 0 : (wins / closedTrades.length) * 100;
    const totalPnl = patternTrades.reduce((total, trade) => total + trade.pnl, 0);
    const row = document.createElement("tr");
    const patternCell = document.createElement("td");
    const countCell = document.createElement("td");
    const winRateCell = document.createElement("td");
    const pnlCell = document.createElement("td");

    patternCell.textContent = pattern;
    countCell.textContent = String(patternTrades.length);
    winRateCell.textContent = `${winRate.toFixed(1)}%`;
    pnlCell.className = "trade-pnl";
    pnlCell.textContent = `${totalPnl > 0 ? "+" : ""}${formatCurrency(totalPnl)}`;
    setSignedClass(pnlCell, totalPnl);
    row.append(patternCell, countCell, winRateCell, pnlCell);
    elements.patternStats.append(row);
  }

  elements.patternEmpty.hidden = trades.length > 0;
}

function renderCooldownAlert() {
  const recentTrades = [...trades]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 2);
  elements.cooldownAlert.hidden =
    recentTrades.length < 2 || !recentTrades.every((trade) => trade.pnl < 0);
}

function renderTrades() {
  elements.tradeList.replaceChildren();
  elements.emptyState.hidden = trades.length > 0;
  elements.logTradeCount.textContent = `${trades.length} ${
    trades.length === 1 ? "operación" : "operaciones"
  }`;

  for (const trade of [...trades].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))) {
    const row = document.createElement("tr");
    const pairCell = document.createElement("td");
    const patternCell = document.createElement("td");
    const structureCell = document.createElement("td");
    const styleCell = document.createElement("td");
    const emotionCell = document.createElement("td");
    const planCell = document.createElement("td");
    const newsContextCell = document.createElement("td");
    const executionTypeCell = document.createElement("td");
    const marketOcoCell = document.createElement("td");
    const fundamentalsCell = document.createElement("td");
    const dateCell = document.createElement("td");
    const pnlCell = document.createElement("td");
    const notesCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    const tradeDate = new Date(trade.date);

    pairCell.textContent = trade.pair;
    patternCell.textContent = trade.pattern?.trim() || "Sin categoría";
    structureCell.textContent = trade.structure?.trim() || "Sin especificar";
    styleCell.textContent = trade.style?.trim() || "—";
    emotionCell.textContent = trade.emotion?.trim() || "—";
    planCell.textContent =
      typeof trade.planRespected === "boolean" ? (trade.planRespected ? "Sí" : "No") : "—";
    newsContextCell.textContent = trade.newsContext || "—";
    executionTypeCell.textContent = trade.executionType || "—";
    marketOcoCell.textContent =
      typeof trade.marketOcoConfirmed === "boolean"
        ? trade.executionType === MARKET_ORDER_TYPE
          ? trade.marketOcoConfirmed
            ? "Sí"
            : "No"
          : "No aplica"
        : "—";
    fundamentalsCell.textContent = trade.isNewAsset
      ? formatFundamentalChecks(trade.fundamentalChecks)
      : "No es nuevo";
    dateCell.className = "trade-date";
    dateCell.textContent = dateFormatter.format(tradeDate);
    pnlCell.className = "trade-pnl";
    pnlCell.textContent = `${trade.pnl > 0 ? "+" : ""}${formatCurrency(trade.pnl)}`;
    setSignedClass(pnlCell, trade.pnl);
    notesCell.className = "trade-notes";
    notesCell.textContent = trade.notes || "—";
    if (trade.notes) {
      notesCell.title = trade.notes;
    }

    deleteButton.className = "delete-trade";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Eliminar operación ${trade.pair}`);
    deleteButton.dataset.tradeId = trade.id;

    actionCell.append(deleteButton);
    row.append(
      pairCell,
      patternCell,
      structureCell,
      styleCell,
      emotionCell,
      planCell,
      newsContextCell,
      executionTypeCell,
      marketOcoCell,
      fundamentalsCell,
      dateCell,
      pnlCell,
      notesCell,
      actionCell,
    );
    elements.tradeList.append(row);
  }
}

function formatFundamentalChecks(checks) {
  if (!checks) {
    return "Sin datos";
  }

  return [
    `Utilidad ${checks.utility ? "✓" : "—"}`,
    `Oferta ${checks.supply ? "✓" : "—"}`,
    `Red ${checks.network ? "✓" : "—"}`,
  ].join(" · ");
}

elements.capitalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.capitalError.textContent = "";
  elements.capitalSaved.textContent = "";

  const value = Number(elements.baseCapitalInput.value);
  if (!Number.isFinite(value) || value < 0 || elements.baseCapitalInput.value === "") {
    elements.capitalError.textContent = "Ingresa un capital base válido (cero o mayor).";
    return;
  }

  if (saveBaseCapital(value)) {
    showStorageError("");
    elements.capitalSaved.textContent = "Capital base guardado.";
    renderDashboard();
  }
});

elements.withdrawalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.withdrawalError.textContent = "";

  const amountValue = elements.withdrawalAmount.value;
  const amount = Number(amountValue);
  if (!Number.isFinite(amount) || amount <= 0 || amountValue === "") {
    elements.withdrawalError.textContent = "Ingresa un importe de retiro mayor a cero.";
    return;
  }

  const availableProfit = getAvailableProfitForWithdrawal();
  if (amount > availableProfit) {
    elements.withdrawalError.textContent =
      "El retiro no puede superar los beneficios acumulados disponibles; el capital base queda protegido.";
    return;
  }

  const nextWithdrawals = [
    ...withdrawals,
    {
      id: globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      amount,
      destination: elements.withdrawalDestination.value.trim(),
      date: new Date().toISOString(),
    },
  ];

  if (saveWithdrawals(nextWithdrawals)) {
    showStorageError("");
    elements.withdrawalForm.reset();
    renderDashboard();
  }
});

elements.riskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.riskError.textContent = "";

  const entry = Number(elements.entryPrice.value);
  const takeProfitPercent = Number(elements.takeProfit.value);
  const stopLossPercent = Number(elements.stopLoss.value);
  const riskPercent = Number(elements.riskPercent.value);
  if (
    !Number.isFinite(entry) ||
    !Number.isFinite(takeProfitPercent) ||
    !Number.isFinite(stopLossPercent) ||
    !Number.isFinite(riskPercent) ||
    entry <= 0 ||
    takeProfitPercent < 0 ||
    stopLossPercent < 0 ||
    riskPercent < 0 ||
    riskPercent > 100 ||
    elements.entryPrice.value === "" ||
    elements.takeProfit.value === "" ||
    elements.stopLoss.value === "" ||
    elements.riskPercent.value === ""
  ) {
    elements.riskError.textContent =
      "Revisa los valores: entrada mayor a cero, porcentajes no negativos y riesgo de cuenta hasta 100%.";
    elements.riskResults.hidden = true;
    return;
  }

  const direction = elements.riskDirection.value === "short" ? -1 : 1;
  const takeProfitPrice = entry * (1 + (direction * takeProfitPercent) / 100);
  const stopLossPrice = entry * (1 - (direction * stopLossPercent) / 100);
  elements.takeProfitPrice.textContent = `${priceFormatter.format(takeProfitPrice)} USDT`;
  elements.stopLossPrice.textContent = `${priceFormatter.format(stopLossPrice)} USDT`;
  elements.riskResults.hidden = false;
  updateRiskAssessment();
});

function updateRiskAssessment() {
  const riskPercent = Number(elements.riskPercent.value);
  if (
    elements.riskPercent.value === "" ||
    !Number.isFinite(riskPercent) ||
    riskPercent < 0 ||
    riskPercent > 100
  ) {
    elements.riskRangeAlert.hidden = true;
    return;
  }

  const riskAmount = Math.max(0, getCurrentCapital()) * (riskPercent / 100);
  elements.riskAmount.textContent = formatCurrency(riskAmount);
  const outsideRecommendedRange = riskPercent < 1 || riskPercent > 3;
  elements.riskRangeAlert.hidden = !outsideRecommendedRange;
  elements.riskRangeAlert.classList.toggle("risk-range-alert-high", riskPercent > 3);
  elements.riskRangeAlert.textContent =
    riskPercent > 3
      ? "Alerta: el riesgo supera el rango recomendado del 1% al 3% de la cuenta."
      : "Aviso: el riesgo está por debajo del rango recomendado del 1% al 3% de la cuenta.";
}

elements.riskPercent.addEventListener("input", updateRiskAssessment);

elements.discordRadarWebhookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.discordRadarWebhookInput.value.trim();
  if (!saveDiscordWebhook(value, STORAGE_KEYS.discordRadarWebhook, elements.discordRadarWebhookStatus)) {
    return;
  }
  discordRadarWebhookUrl = value ? validateDiscordWebhookUrl(value) : "";
  elements.discordRadarWebhookStatus.textContent = value
    ? "Webhook del Radar General guardado en este navegador."
    : "Webhook del Radar General eliminado. Sus alertas están desactivadas.";
});

elements.discordFuturesWebhookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.discordFuturesWebhookInput.value.trim();
  if (!saveDiscordWebhook(value, STORAGE_KEYS.discordFuturesWebhook, elements.discordFuturesWebhookStatus)) {
    return;
  }
  discordFuturesWebhookUrl = value ? validateDiscordWebhookUrl(value) : "";
  elements.discordFuturesWebhookStatus.textContent = value
    ? "Webhook del Francotirador guardado en este navegador."
    : "Webhook del Francotirador eliminado. Sus alertas están desactivadas.";
});

async function testDiscordWebhook(input, button, status, channelLabel) {
  let webhookUrl;
  try {
    webhookUrl = validateDiscordWebhookUrl(input.value);
  } catch (error) {
    status.textContent = `No se pudo probar ${channelLabel}: ${error.message}`;
    return;
  }

  button.disabled = true;
  try {
    await sendDiscordEmbed(
      {
        title: `Oráculo · Prueba · ${channelLabel}`,
        description:
          `Si recibes este embed, el canal ${channelLabel} está conectado correctamente. ` +
          "Las alertas reales incluyen dirección, par, temporalidad, POI, SL y TP.",
        color: channelLabel === "Radar General" ? 0x638fff : 0xe6ad58,
        timestamp: new Date().toISOString(),
      },
      webhookUrl,
      `Prueba · ${channelLabel}`,
      status,
    );
  } finally {
    button.disabled = false;
  }
}

elements.discordRadarWebhookTest.addEventListener("click", () =>
  testDiscordWebhook(
    elements.discordRadarWebhookInput,
    elements.discordRadarWebhookTest,
    elements.discordRadarWebhookStatus,
    "Radar General",
  ),
);
elements.discordFuturesWebhookTest.addEventListener("click", () =>
  testDiscordWebhook(
    elements.discordFuturesWebhookInput,
    elements.discordFuturesWebhookTest,
    elements.discordFuturesWebhookStatus,
    "Francotirador",
  ),
);

elements.radarForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  latestRadarSignal = null;
  elements.radarChart.hidden = true;
  elements.radarResults.hidden = true;
  elements.radarStatus.textContent = "Consultando velas públicas de Binance…";
  elements.radarSubmit.disabled = true;
  elements.radarSimulate.disabled = true;

  try {
    const symbol = elements.radarSymbol.value.trim().toUpperCase();
    const timeframe = elements.radarTimeframe.value;
    const candles = await fetchBinanceCandles(symbol, timeframe);
    const lastCandle = normalizeCandle(candles[candles.length - 1]);
    if (!lastCandle) {
      throw new Error("La última vela de Binance contiene valores OHLC inválidos.");
    }
    latestMarketSnapshot = { symbol, timeframe, price: lastCandle.close };
    receiveLiveCandles(candles, { symbol, timeframe, source: "Binance" });
  } catch (error) {
    latestRadarSignal = null;
    elements.radarChart.hidden = true;
    elements.radarResults.hidden = true;
    elements.radarStatus.textContent = `No se pudo analizar el mercado: ${error.message}`;
  } finally {
    elements.radarSubmit.disabled = false;
    elements.radarSimulate.disabled = false;
  }
});

elements.radarSimulate.addEventListener("click", () => {
  const direction = elements.radarSimulationDirection.value;
  const timeframe = elements.radarTimeframe.value;
  const requestedSymbol = elements.radarSymbol.value.trim().toUpperCase();
  const hasMarketReference =
    latestMarketSnapshot?.symbol === requestedSymbol &&
    latestMarketSnapshot.timeframe === timeframe;
  const symbol = hasMarketReference ? requestedSymbol : "DEMOUSDT";
  const referencePrice = hasMarketReference ? latestMarketSnapshot.price : 100;
  const directionLabel = direction === "bullish" ? "alcista" : "bajista";
  elements.radarSimulate.disabled = true;
  latestRadarSignal = null;
  elements.radarChart.hidden = true;
  elements.radarResults.hidden = true;
  elements.radarStatus.textContent = `Preparando simulación local ${directionLabel}…`;

  try {
    const candles = buildSimulationCandles(direction, referencePrice, timeframe);
    receiveLiveCandles(candles, {
      symbol,
      timeframe,
      source: `SIMULACIÓN SINTÉTICA · ${directionLabel}`,
      isSimulation: true,
    });
  } catch (error) {
    latestRadarSignal = null;
    elements.radarChart.hidden = true;
    elements.radarResults.hidden = true;
    elements.radarStatus.textContent = `No se pudo ejecutar la simulación: ${error.message}`;
  } finally {
    elements.radarSimulate.disabled = false;
  }
});

elements.futuresForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.futuresSignal.hidden = true;
  elements.futuresChart.hidden = true;
  elements.futuresStatus.textContent = "Consultando velas cerradas de Binance USDⓈ-M Futures…";
  elements.futuresStatus.classList.remove("futures-status-active");
  elements.futuresSubmit.disabled = true;

  try {
    const symbol = elements.futuresSymbol.value.trim().toUpperCase();
    const timeframe = elements.futuresTimeframe.value;
    const candles = await fetchBinanceFuturesCandles(symbol, timeframe);
    const setup = receiveFuturesCandles(candles, {
      symbol,
      timeframe,
      source: "Binance USDⓈ-M Futures",
    });
    if (!setup.active) {
      elements.futuresStatus.textContent =
        "Modo Francotirador Activo: Esperando configuración de alta probabilidad. Sin ruido. " +
        (setup.reason || "El filtro estricto no confirmó todas las condiciones.");
    }
  } catch (error) {
    renderFuturesRest(`No se pudo analizar futuros: ${error.message}`);
    elements.futuresChart.hidden = true;
  } finally {
    elements.futuresSubmit.disabled = false;
  }
});

globalThis.OraculoMarketData = Object.freeze({
  receiveCandles: receiveLiveCandles,
  fetchBinanceCandles,
  analyzeFuturesCandles,
  receiveFuturesCandles,
  fetchBinanceFuturesCandles,
});

elements.riskSmcReminder.textContent = SMART_MONEY_REMINDER;
elements.executionReminder.textContent = EXECUTION_REMINDER;

function updateMarketOrderChecklist() {
  const isMarketOrder = elements.tradeExecutionType.value === MARKET_ORDER_TYPE;
  elements.marketOcoField.hidden = !isMarketOrder;
  elements.tradeMarketOco.required = isMarketOrder;
  if (!isMarketOrder) {
    elements.tradeMarketOco.checked = false;
  }
}

elements.tradeExecutionType.addEventListener("change", updateMarketOrderChecklist);
updateMarketOrderChecklist();

function updateFundamentalChecklist() {
  const isNewAsset = elements.tradeNewAsset.checked;
  elements.fundamentalChecklist.hidden = !isNewAsset;
  for (const checkbox of [
    elements.fundamentalUtility,
    elements.fundamentalSupply,
    elements.fundamentalNetwork,
  ]) {
    checkbox.required = isNewAsset;
  }
}

elements.tradeNewAsset.addEventListener("change", updateFundamentalChecklist);
updateFundamentalChecklist();

elements.tradeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.tradeError.textContent = "";

  if (getTodayTradeCount() >= DAILY_TRADE_LIMIT) {
    renderDailyTradeAlert();
    return;
  }

  const now = new Date();
  const sessionName = getMarketSession(now).name;
  if (getSessionTradeCount(now, sessionName) >= SESSION_TRADE_LIMIT) {
    renderSessionTradeCount(now);
    return;
  }

  const pair = elements.tradePair.value.trim().toUpperCase();
  const pnlValue = elements.tradePnl.value;
  const pnl = Number(pnlValue);
  if (!pair || !Number.isFinite(pnl) || pnlValue === "") {
    elements.tradeError.textContent = "Ingresa un par y un PnL válido.";
    return;
  }

  const nextTrades = [
    ...trades,
    {
      id: globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      pair,
      pnl,
      pattern: elements.tradePattern.value,
      structure: elements.tradeStructure.value,
      style: elements.tradeStyle.value,
      emotion: elements.tradeEmotion.value,
      planRespected: elements.tradePlanRespected.checked,
      newsContext: elements.tradeNewsContext.value,
      executionType: elements.tradeExecutionType.value,
      marketOcoConfirmed: elements.tradeMarketOco.checked,
      marketSession: sessionName,
      isNewAsset: elements.tradeNewAsset.checked,
      fundamentalChecks: {
        utility: elements.fundamentalUtility.checked,
        supply: elements.fundamentalSupply.checked,
        network: elements.fundamentalNetwork.checked,
      },
      notes: elements.tradeNotes.value.trim(),
      date: new Date().toISOString(),
    },
  ];

  if (saveTrades(nextTrades)) {
    showStorageError("");
    elements.tradeForm.reset();
    updateMarketOrderChecklist();
    updateFundamentalChecklist();
    renderDashboard();
  }
});

elements.tradePattern.addEventListener("change", () => {
  const guide = PATTERN_GUIDES[elements.tradePattern.value];
  elements.patternGuide.textContent = guide || "";
  elements.patternGuide.hidden = !guide;
});

elements.tradeList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const deleteButton = target.closest("button[data-trade-id]");
  if (!deleteButton) {
    return;
  }

  const nextTrades = trades.filter((trade) => trade.id !== deleteButton.dataset.tradeId);
  if (saveTrades(nextTrades)) {
    showStorageError("");
    renderDashboard();
  }
});

renderDashboard();
updateMarketSession();
globalThis.setInterval(updateMarketSession, 60_000);
