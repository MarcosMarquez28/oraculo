(function initializeOraculoStrategy() {
"use strict";

const FUTURES_MINIMUM_SCORE = 80;

function analyzeOpportunity(candles) {
  const hasClosureMetadata = candles.some((candle) => candle.isClosed !== undefined);
  const closedCandles = hasClosureMetadata
    ? candles.filter((candle) => candle.isClosed !== false)
    : candles.slice(0, -1);
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
    orderBlockIndex,
    impulseIndex,
    orderBlockBodyRatio,
    orderBlockBarsAgo,
    impulseBodyRatio: medianBody > 0 ? impulseBody / medianBody : 0,
    stopLoss,
    takeProfit,
    extension,
    structureBoundary,
    hasImbalance,
    lastClosedCandleTime: impulse.closeTime,
  };
}

function analyzeFuturesSetup(candles) {
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

const strategy = Object.freeze({
  FUTURES_MINIMUM_SCORE,
  analyzeOpportunity,
  analyzeFuturesSetup,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = strategy;
} else {
  globalThis.OraculoStrategy = strategy;
}
})();
