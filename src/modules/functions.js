export function castToNum(str) {
  const type = typeof str;
  if (str && type === "number") return str;
  if (str && type === "string") return Number(str.replace(/[^\d.-]/g, ""));
  return 0;
}

export function calcConcentrationFactor(
  volumeInMillilitre,
  stockMicrogramPerMillilitre = 500,
  outputVolumeInMicrolitre = 10000
) {
  return (stockMicrogramPerMillilitre * volumeInMillilitre) / outputVolumeInMicrolitre; // gives final concentration micrograms per mil
}

export function sumInt(args) {
  const arg = args || arguments;
  return arg.reduce((a, b) => a + b, 0);
}

export function calcBoundAntibody(value, concentration, efficiency, binding) {
  if (value === 0) return 0;
  const value1 = concentration * efficiency * value;
  return value1 + concentration * binding;
}

export function washModifierPrimary(value, washResidue) {
  let output = value - 4 * washResidue * value + washResidue * 2;
  return output;
}

export function washModifierSecondary(value, washResidue, binding) {
  if (value === 0) return 0;
  let output = value + washResidue * binding * 100;
  if (output < 0.05) output = 0.05;
  if (output > 2) output = 2;
  return output;
}

export function calcDilutionFactor(volume, dilutionModifier = 100) {
  const vol = +volume; // make sure it's not a string
  const result = (dilutionModifier + vol) / vol;
  return result === Infinity ? 0 : result;
}

export function calcDilutionSeries(value = 0, dilutionFactor = 1.0, efficiencyFactor = 1.0) {
  const values = [+value];
  for (let i = 1; i < 12; i++) {
    let val = (values[i - 1] / +dilutionFactor) * efficiencyFactor;
    values.push(val || 0);
  }
  return values;
}

const randomDec = (low = 0, high = 1, toFixed = 1) => {
  let val = Math.random() * (high - low) + low; // this will get a number between low and high;
  return val.toFixed(toFixed);
};

export function calcVariance(value, percent = 8, toFixed = 2) {
  if (percent === 0) return +value;
  const max = (value / 100) * percent;
  const variance = randomDec(-max, max, toFixed);
  return +variance;
}

export const roundPrecision = (num, dec) => {
  if (typeof num !== "number" || typeof dec !== "number") return false;
  const numSign = num >= 0 ? 1 : -1;
  return (Math.round(num * Math.pow(10, dec) + numSign * 0.0001) / Math.pow(10, dec)).toFixed(dec);
};

export function timeModifier(value, timesInMilSec) {
  if (!timesInMilSec || timesInMilSec === 0) return value;
  const timeModifier = 1 - 5 / timeToMins(timesInMilSec);
  const result = value * Math.max(timeModifier, 0.05);
  return result;
}

export function calclateWashEfficiency(timesInMilSec) {
  const mins = timeToMins(timesInMilSec);
  const washEfficiency = 0.9 - 0.5 / mins;
  return Math.max(washEfficiency, 0);
}

export function calcWashResidue(washEfficiencies = []) {
  if (!Array.isArray(washEfficiencies) || washEfficiencies.length === 0) {
    return 1;
  }
  const temp = washEfficiencies.filter(i => i).map(i => 1 - i);
  let val = temp.shift();
  temp.map(v => (val = val * v));
  return val;
}

export function calcWashResidueFromTimes(time = []) {
  const washEffiencies = time.filter(i => i).map(t => calclateWashEfficiency(t));

  const residue = calcWashResidue(washEffiencies);
  return residue;
}

export function calcOpticalDensity(value, time) {
  const seconds = timeToMins(time);
  return Math.min(0.03 + (seconds / 30) * value, 2);
  //return Math.min(0.03 + (seconds / 100) * value, 2);
}

export function calcOpticalDensityForWavelength(opticalDensityValue, wavelengthModifier) {
  return opticalDensityValue * wavelengthModifier;
}

export function calcOpacity(opticalDensityValue) {
  return opticalDensityValue / 2; // od max is 2, css opacity has max of 1
}

export function timeToMins(timesInMilSec) {
  return Math.round(+new Date(timesInMilSec) / 1000 / 60);
}

export function timeToSecs(timesInMilSec) {
  return Math.round(+new Date(timesInMilSec) / 1000);
}
