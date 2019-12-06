export function calcConcentrationFactor(
  volume,
  initialConcentration = 500 // microgramPerMil
) {
  return (initialConcentration * volume) / 10000; // gives final concentration micrograms per mil
}

export function sumInt(args) {
  const arg = args || arguments;
  return arg.reduce((a, b) => a + b, 0);
}

export function calcBoundAntibody(
  value,
  concentration,
  efficiency,
  binding
) {
  if (+value === 0) return 0;
  const value1 = concentration * efficiency * value;
  return value1 + concentration * binding;
}

export function washModifier(value, washResidue, binding) {
  let output = value + washResidue * binding * 100;
  //output = output + calcVariance(output, 8);
  if (output < 0.05) output = 0.05;
  if (output > 2) output = 2;
  return output;
}

export function calcDilutionFactor(volume) {
  const vol = +volume; // make sure it's not a string
  return (100 + vol) / vol;
}

export function calcDilutionSeries(
  value = 0,
  dilutionFactor = 1.0,
  efficiencyFactor = 1.0
) {
  const values = [+value];
  for (let i = 1; i < 12; i++) {
    let val = (values[i - 1] / +dilutionFactor) * efficiencyFactor;
    values.push(val);
  }
  return values;
}

const randomDec = (low = 0, high = 1, toFixed = 1) => {
  let val = Math.random() * (high - low) + low; // this will get a number between low and high;
  return val.toFixed(toFixed);
};

export function calcVariance(value, percent = 8, toFixed = 2) {
  if(percent === 0) return +value;
  const max = (value / 100) * percent;
  const variance = randomDec(-max, max, toFixed);
  return +variance;
}

export const roundPrecision = (num, dec) => {
  if (typeof num !== "number" || typeof dec !== "number") return false;
  const numSign = num >= 0 ? 1 : -1;
  return (
    Math.round(num * Math.pow(10, dec) + numSign * 0.0001) / Math.pow(10, dec)
  ).toFixed(dec);
};

export function timeModifier(value, timesInMilSec) {
  if (!timesInMilSec) return value;
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
  const washEffiencies = time
    .filter(i => i)
    .map(t => calclateWashEfficiency(t));

  const residue = calcWashResidue(washEffiencies);
  return residue;
}

export function calcOpticalDensity(value, seconds) {
  return Math.min(0.03 + (seconds / 1800) * value, 2);
}

export function calcOpacityForWavelength(opticalDensityValue, wavelengthModifier) {
  return opticalDensityValue * wavelengthModifier;
}

export function calcOpacity(opticalDensityValue) {
  return (opticalDensityValue / 2); // od max is 2, css opacity has max of 1
}

export function timeToMins(timesInMilSec) {
  //return Math.round(+new Date(timesInMilSec) / 60);
  return Math.round(+new Date(timesInMilSec) / 1000 / 60);
}
