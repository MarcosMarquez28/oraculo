"use strict";

const path = require("node:path");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
require("dotenv").config();

const PORT = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
const BOT_TIMEZONE = process.env.BOT_TIMEZONE || "UTC";
const BACKUP_SCAN_CRON = process.env.BACKUP_SCAN_CRON || "*/15 * * * *";
const RADAR_TIMEFRAME = process.env.RADAR_TIMEFRAME || "15m";
const FUTURES_TIMEFRAME = process.env.FUTURES_TIMEFRAME || "1h";
const FUTURES_MINIMUM_SCORE = 80;
const MAX_SYMBOLS = 10;
const MAX_SEEN_ALERT_KEYS = 1000;
const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) {
  throw new Error("PORT debe ser un número entero entre 1 y 65535.");
}

function parseSymbols(value) {
  const symbols = [...new Set(
    (value || DEFAULT_SYMBOLS.join(","))
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean),
  )];
  if (
    symbols.length === 0 ||
    symbols.length > MAX_SYMBOLS ||
    symbols.some((symbol) => !/^[A-Z0-9]{5,20}$/.test(symbol))
  ) {
    throw new Error(`SCAN_SYMBOLS debe contener de 1 a ${MAX_SYMBOLS} pares válidos, por ejemplo BTCUSDT,ETHUSDT.`);
  }
  return symbols;
}

function getWebhookUrl(value, variableName) {
  if (!value) {
    return "";
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} no es una URL válida de Discord.`);
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
    throw new Error(`${variableName} debe ser un webhook HTTPS válido de discord.com.`);
  }
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.href;
}

function validateTimeframes() {
  if (!["5m", "15m", "1h", "4h"].includes(RADAR_TIMEFRAME)) {
    throw new Error("RADAR_TIMEFRAME debe ser 5m, 15m, 1h o 4h.");
  }
  if (!["1h", "4h"].includes(FUTURES_TIMEFRAME)) {
    throw new Error("FUTURES_TIMEFRAME debe ser 1h o 4h.");
  }
  new Intl.DateTimeFormat("en-US", { timeZone: BOT_TIMEZONE });
  if (!cron.validate(BACKUP_SCAN_CRON)) {
    throw new Error("BACKUP_SCAN_CRON no contiene una expresión cron válida.");
  }
}

const symbols = parseSymbols(process.env.SCAN_SYMBOLS);
const radarWebhook = getWebhookUrl(process.env.WEBHOOK_RADAR, "WEBHOOK_RADAR");
const futuresWebhook = getWebhookUrl(
  process.env.WEBHOOK_FRANCOTIRADOR,
  "WEBHOOK_FRANCOTIRADOR",
);
validateTimeframes();

const app = express();
const seenAlertKeys = new Set();
const scheduledTasks = [];
let scanInProgress = false;
let lastScanAt = null;

app.get("/", (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});
app.get("/app.js", (_request, response) => {
  response.sendFile(path.join(__dirname, "app.js"));
});
app.get("/styles.css", (_request, response) => {
  response.sendFile(path.join(__dirname, "styles.css"));
});
app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    scanner: scanInProgress ? "running" : "idle",
    lastScanAt,
    timezone: BOT_TIMEZONE,
  });
});

function normalizeCandle(rawCandle) {
  if (!Array.isArray(rawCandle) || rawCandle.length < 7) {
    return null;
  }
  const time = Number(rawCandle[0]);
  const open = Number(rawCandle[1]);
  const high = Number(rawCandle[2]);
  const low = Number(rawCandle[3]);
  const close = Number(rawCandle[4]);
  const closeTime = Number(rawCandle[6]);
  if (
    ![time, open, high, low, close, closeTime].every(Number.isFinite) ||
    low <= 0 ||
    high < Math.max(open, close) ||
    low > Math.min(open, close)
  ) {
    return null;
  }
  return { time, open, high, low, close, closeTime, isClosed: closeTime < Date.now() };
}

async function fetchCandles(symbol, timeframe, market) {
  const baseUrl = market === "futures"
    ? "https://fapi.binance.com/fapi/v1/klines"
    : "https://api.binance.com/api/v3/klines";
  const { data } = await axios.get(baseUrl, {
    params: { symbol, interval: timeframe, limit: 100 },
    timeout: 10_000,
  });
  if (!Array.isArray(data)) {
    throw new Error(`Binance ${market} devolvió una respuesta de velas inválida.`);
  }
  const candles = data.map(normalizeCandle);
  if (candles.some((candle) => candle === null)) {
    throw new Error(`Binance ${market} devolvió velas OHLC inválidas.`);
  }
  return candles;
}

function analyzeOpportunity(candles) {
  const closedCandles = candles.filter((candle) => candle.isClosed);
  if (closedCandles.length < 22) {
    return { reason: "Se necesitan al menos 22 velas cerradas." };
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
    return { reason: "No se detectó un impulso confirmado con suficiente fuerza." };
  }

  const direction = impulse.close > impulse.open ? 1 : -1;
  const structureStart = Math.max(0, impulseIndex - 14);
  const structureCandles = closedCandles.slice(structureStart, impulseIndex - 3);
  if (structureCandles.length < 3) {
    return { reason: "No hay suficientes velas previas para confirmar CHoCH." };
  }
  const structureBoundary = direction === 1
    ? Math.max(...structureCandles.map((candle) => candle.high))
    : Math.min(...structureCandles.map((candle) => candle.low));
  if (direction === 1 ? impulse.close <= structureBoundary : impulse.close >= structureBoundary) {
    return { reason: "El cierre no confirmó un cambio de estructura (CHoCH)." };
  }

  let orderBlock = null;
  let orderBlockIndex = -1;
  for (let index = impulseIndex - 1; index >= Math.max(0, impulseIndex - 10); index -= 1) {
    const candle = closedCandles[index];
    const isOpposingCandle = direction === 1
      ? candle.close < candle.open
      : candle.close > candle.open;
    if (isOpposingCandle) {
      orderBlock = candle;
      orderBlockIndex = index;
      break;
    }
  }
  if (!orderBlock) {
    return { reason: "No se encontró una vela contraria para delimitar el POI." };
  }

  const candleTwoBack = closedCandles[impulseIndex - 2];
  const hasImbalance = direction === 1
    ? impulse.low > candleTwoBack.high
    : impulse.high < candleTwoBack.low;
  const entryLow = orderBlock.low;
  const entryHigh = orderBlock.high;
  const orderBlockRange = orderBlock.high - orderBlock.low;
  const orderBlockBodyRatio = orderBlockRange > 0
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
    stopLoss,
    takeProfit,
    extension,
    orderBlockBodyRatio,
    orderBlockBarsAgo,
    impulseBodyRatio: medianBody > 0 ? impulseBody / medianBody : 0,
    hasImbalance,
    lastClosedCandleTime: impulse.closeTime,
  };
}

function analyzeFutures(candles) {
  const setup = analyzeOpportunity(candles);
  if (!setup.direction) {
    return { ...setup, active: false, score: 0 };
  }
  const clearOrderBlock = setup.orderBlockBodyRatio >= 0.35 && setup.orderBlockBarsAgo <= 5;
  const entry = (setup.entryLow + setup.entryHigh) / 2;
  const riskDistance = Math.abs(entry - setup.stopLoss);
  const rewardRiskRatio = riskDistance > 0
    ? Math.abs(setup.takeProfit - entry) / riskDistance
    : 0;
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
  return {
    ...setup,
    active: clearOrderBlock && setup.impulseBodyRatio >= 1.5 && score >= FUTURES_MINIMUM_SCORE,
    clearOrderBlock,
    score,
  };
}

function formatPrice(value) {
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value)} USDT`;
}

function createSignalEmbed(signal, { symbol, timeframe, market, type }) {
  const isLong = signal.direction === 1;
  const fields = [
    { name: "Par", value: symbol, inline: true },
    { name: "Temporalidad", value: timeframe, inline: true },
    ...(type === "futures"
      ? [{ name: "Puntaje de confluencia", value: `${signal.score}/100`, inline: true }]
      : [{ name: "Análisis", value: "Impulso + CHoCH confirmado", inline: true }]),
    {
      name: "Zona POI · Order Block",
      value: `${formatPrice(signal.entryLow)} – ${formatPrice(signal.entryHigh)}`,
      inline: false,
    },
    { name: "Stop Loss · invalidez", value: formatPrice(signal.stopLoss), inline: true },
    { name: "Take Profit conservador", value: formatPrice(signal.takeProfit), inline: true },
    { name: "Proyección de extensión", value: formatPrice(signal.extension), inline: true },
  ];
  return {
    title: `Oráculo · ALERTA ${isLong ? "LONG" : "SHORT"} · ${symbol}`,
    description:
      "Señal confirmada en vela cerrada. Espera el retroceso a POI / Order Block; " +
      "no persigas el precio ni tomes esta alerta como una orden.",
    color: isLong ? 0x27d99a : 0xff657a,
    fields,
    footer: { text: `${market} · Oráculo no ejecuta órdenes` },
    timestamp: new Date().toISOString(),
  };
}

async function sendAlert(webhookUrl, signal, details) {
  if (!webhookUrl) {
    console.warn(`Se detectó una señal ${details.type} para ${details.symbol}, pero su webhook no está configurado.`);
    return false;
  }
  const embed = createSignalEmbed(signal, details);
  try {
    await axios.post(`${webhookUrl}?wait=true`, { embeds: [embed] }, { timeout: 10_000 });
    console.info(`Alerta ${details.type} enviada: ${details.symbol} ${details.timeframe} ${signal.direction === 1 ? "LONG" : "SHORT"}.`);
    return true;
  } catch (error) {
    const status = error.response?.status ? ` (HTTP ${error.response.status})` : "";
    console.error(`Falló el envío de alerta ${details.type} para ${details.symbol}${status}: ${error.message}`);
    return false;
  }
}

function getAlertKey(market, symbol, timeframe, signal) {
  return [market, symbol, timeframe, signal.lastClosedCandleTime, signal.direction].join(":");
}

async function scanMarket(symbol, timeframe, market) {
  const candles = await fetchCandles(symbol, timeframe, market);
  const signal = market === "futures" ? analyzeFutures(candles) : analyzeOpportunity(candles);
  if (market === "futures" && (!signal.active || signal.score < FUTURES_MINIMUM_SCORE)) {
    return false;
  }
  if (market === "spot" && !signal.direction) {
    return false;
  }
  const webhookUrl = market === "futures" ? futuresWebhook : radarWebhook;
  const details = {
    type: market,
    symbol,
    timeframe,
    market: market === "futures" ? "Binance USDⓈ-M Futures" : "Binance Spot",
  };
  const alertKey = getAlertKey(market, symbol, timeframe, signal);
  if (seenAlertKeys.has(alertKey)) {
    return false;
  }
  if (await sendAlert(webhookUrl, signal, details)) {
    seenAlertKeys.add(alertKey);
    if (seenAlertKeys.size > MAX_SEEN_ALERT_KEYS) {
      seenAlertKeys.delete(seenAlertKeys.values().next().value);
    }
    return true;
  }
  return false;
}

async function runScan(trigger) {
  if (scanInProgress) {
    console.warn(`Se omitió el escaneo ${trigger}: ya hay un ciclo en curso.`);
    return;
  }
  scanInProgress = true;
  lastScanAt = new Date().toISOString();
  console.info(`Iniciando escaneo ${trigger} (${symbols.length} pares, zona horaria ${BOT_TIMEZONE}).`);
  try {
    for (const symbol of symbols) {
      for (const [market, timeframe] of [
        ["spot", RADAR_TIMEFRAME],
        ["futures", FUTURES_TIMEFRAME],
      ]) {
        try {
          await scanMarket(symbol, timeframe, market);
        } catch (error) {
          console.error(`Error al escanear ${symbol} ${market} ${timeframe}: ${error.message}`);
        }
      }
    }
  } finally {
    scanInProgress = false;
    console.info(`Finalizó escaneo ${trigger}.`);
  }
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.info(`Oráculo escuchando en el puerto ${PORT}.`);
  console.info(`Escaneo programado: 09:00, 15:00 y 20:00 (${BOT_TIMEZONE}); respaldo: ${BACKUP_SCAN_CRON}.`);
  if (!radarWebhook) {
    console.warn("WEBHOOK_RADAR no está configurado; las alertas Spot no se enviarán.");
  }
  if (!futuresWebhook) {
    console.warn("WEBHOOK_FRANCOTIRADOR no está configurado; las alertas de Futuros no se enviarán.");
  }
});

for (const hour of [9, 15, 20]) {
  scheduledTasks.push(
    cron.schedule(
      `0 ${hour} * * *`,
      () => void runScan(`programado ${String(hour).padStart(2, "0")}:00`),
      { timezone: BOT_TIMEZONE },
    ),
  );
}
scheduledTasks.push(
  cron.schedule(BACKUP_SCAN_CRON, () => void runScan("respaldo periódico"), {
    timezone: BOT_TIMEZONE,
  }),
);

function shutdown(signal) {
  console.info(`Recibida señal ${signal}; cerrando Oráculo.`);
  for (const task of scheduledTasks) {
    task.stop();
  }
  server.close(() => process.exit(0));
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
