const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const assert = require('assert');

var file = fs.readFileSync('./data.csv', 'utf8');
const records = parse(file, []);


class Monologue {
  constructor(patchNumber, drive, oscilators, filter, envelope, lfo) {
    this.patchNumber = patchNumber;
    this.drive = drive
    this.oscilators = oscilators;
    this.filter = filter;
    this.envelope = envelope;
    this.lfo = lfo;
  }

  toString() {
    return `Monologue Patch ${this.patchNumber}\n---------\nDrive: ${this.drive}\nVCO1:\n${this.oscilators[0]}\nVCO2:\n${this.oscilators[1]}\nEnvelope:\n${this.envelope}\nLFO:\n${this.lfo}\n\n`;
  }
}

class Knob {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  getReadableValue() {
    return this.value;
  }

  toString() {
    return `Knob { name: ${this.name}, value: ${this.getReadableValue()}}`
  }

  getName() {
    return this.name;
  }
}

class Switch extends Knob {
  constructor(name, value) {
    super(name, value);
  }

  toString() {
    return `Switch { name: ${this.name}, value: ${this.getReadableValue()}}`
  }
}

class WaveTypeSwitch extends Switch {
  constructor(oscilator, value) {
    super(WaveTypeSwitch.OSCILATOR.properties[oscilator].name, value);
    this.oscilator = oscilator
  }

  getReadableValue() {
    switch(this.value) {
      case 0:
        return 'Sawtooth';
      case 1:
        return 'Triangle';
      case 2:
        if (this.oscilator === 1) {
          return 'Noise';
        } else {
          return 'Square';
        }
      default:
        return 'Unknown';
    }
  }
}

WaveTypeSwitch.OSCILATOR = {
  'VCO1': 0,
  'VCO2': 1,
  'LFO': 2,
  properties: {
    0: {'name': 'VCO1'},
    1: {'name': 'VCO2'},
    2: {'name': 'LFO'}
  }
};

class DutySwitch extends Switch {
  constructor(value) {
    super('Duty', value);
  }

  getReadableValue() {
    switch(this.value) {
      case 0:
        return 'Sync';
      case 1:
        return 'None';
      case 2:
        return 'Ring';
      default:
        return 'Unknown';
    }
  }
}

class OctaveSwitch extends Switch {
  constructor(value) {
    super('Octave', value);
  }
}

class EnvelopeSwitch extends Switch {
  constructor(value) {
    super('Envelope', value);
  }

  getReadableValue() {
      switch(this.value) {
        case 0:
          return 'Gate';
          break;
        case 1:
          return 'ASR';
          break;
        case 2:
          return 'AR';
          break;
        default:
          return 'Unknown';
          break;
      }
  }

}

class TargetSwitch extends Switch {
  constructor(type, value) {
    super(TargetSwitch.Type.properties[type].name, value);
    this.type = type;
  }

  getReadableValue() {
    switch(this.value) {
      case 0:
        return 'Cutoff';
        break;
      case 1:
        return 'Pitch';
        break;
      case 2:
        return this.type ? 'Pitch 2' : 'Shape';
    }
  }

}

TargetSwitch.Type = {
  'ENVELOPE': 0,
  'LFO': 1,
  properties: {
    0: {name: "Envelope"},
    1: {name: "LFO"}
  }
};

class LFOModeSwitch extends Switch {
  constructor(value) {
    super('LFO Mode', value);
  }

  getReadableValue() {
    switch(this.value) {
      case 0:
        return 'Fast';
        break;
      case 1:
        return 'Slow';
        break;
      case 2:
        return 'One Shot';
        break;
      default:
        return 'Unknown';
        break;
    }
  }
}

class Oscilator {
  constructor(wave, shape, level, pitch, duty) {
    this.wave = wave;
    this.shape = shape;
    this.level = level;
    this.pitch = pitch || new Knob('Pitch', 0);
    this.duty = duty || new DutySwitch(1);
  }

  toString() {
    return `\tWave: ${this.wave}\n\tShape: ${this.shape}\n\tLevel: ${this.level}\n\tPitch: ${this.pitch}\n\tDuty: ${this.duty}`;
  }

}

class Filter {
  constructor(cutoff, resonance) {
    this.cutoff = cutoff;
    this.resonance = resonance;
  }
}

class Envelope {
  constructor(type, attack, decay, intensity, target) {
    this.type = type;
    this.attack = attack;
    this.decay = decay;
    this.intensity = intensity;
    this.target = target;
  }

  toString() {
    return `\tType: ${this.type}\n\tAttack: ${this.attack}\n\tDecay: ${this.decay}\n\tInt: ${this.intensity}\n\tTarget: ${this.target}`;
  }
}

class LFO {
  constructor(wave, mode, rate, intensity, target) {
    this.wave = wave;
    this.mode = mode;
    this.rate = rate;
    this.intensity = intensity;
    this.target = target;
  }

  toString() {
    return `\tWave: ${this.wave}\n\tMode: ${this.mode}\n\tRate: ${this.rate}\n\tInt: ${this.intensity}\n\tTarget: ${this.target}`;
  }
 }

function decodeSysEx(data) {

  for (let dataArray of data) {
    dataArray = dataArray.map(x => x * 1);
    const drive = driveFromSysEx(dataArray);
    const oscOne = oscOneFromSysEx(dataArray);
    const oscTwo = oscTwoFromSysEx(dataArray);
    const filter = filterFromSysEx(dataArray);
    const envelope = envFromSysEx(dataArray);
    const lfo = lfoFromSysEx(dataArray);

    console.log(dataArray[27]);
    const monologue = new Monologue(dataArray[7], drive, [oscOne, oscTwo], filter, envelope, lfo);

    console.log(monologue.toString());
  }

}

function driveFromSysEx(dataArray) {
  const value = korgValueUsingSet(dataArray, 41, 39, [19, 23, 27, 31, 51, 55, 59, 63, 83, 115]);
  return new Knob('Drive', value);
}

function oscOneFromSysEx(dataArray) {

  // Waveform
  const testArray = [17, 19, 25, 27, 40, 49, 51, 57, 81, 83, 89];
  let waveValue = 0;
  if(dataArray[42] > 63) {
    waveValue = 1;
  } else if (testArray.includes(dataArray[42])) {
    waveValue = 2;
  }
  const wave = new WaveTypeSwitch(0, waveValue);

  // Shape
  const shapePastHalfway = ((dataArray[23] / 8) % 2 != 0) ? true : false;
  const shapeValue = korgValueFromRaw(dataArray[27], shapePastHalfway);
  const shape = new Knob('Shape', shapeValue);

  // level
  const levelPastHalfway = (dataArray[23] > 64);
  const levelValue = korgValueFromRaw(dataArray[30], levelPastHalfway);
  const level = new Knob('Level', levelValue);

  return new Oscilator(wave, shape, level);
}

function oscTwoFromSysEx(dataArray) {

  // Waveform
  const testArray = [19, 23, 25, 29, 31, 57, 59, 61, 89, 91, 93];
  let waveValue = 2;
  if(dataArray[43] > 63) {
    waveValue = 1;
  } else if (testArray.includes(dataArray[39])) {
    waveValue = 0;
  }
  const wave = new WaveTypeSwitch(1, waveValue);

  // Shape
  const shapeValue = korgValueUsingSet(dataArray, 29, 23, [4, 20, 68, 72, 76, 84, 88, 92]);
  const shape = new Knob('Shape', shapeValue);

  // level
  const levelPastHalfway = (dataArray[31] % 2 != 0) ? true : false;
  const levelValue = korgValueFromRaw(dataArray[32], levelPastHalfway);
  const level = new Knob('Level', levelValue);

  // Sync
  let syncValue = 2;
  if ([102,106].includes(dataArray[44])) {
    syncValue = 0;
  } else if ([101,105].includes(dataArray[44])) {
    syncValue = 1;
  }
  const duty = new DutySwitch(syncValue);

  // pitch
  const pitchValue = korgValueUsingSet(dataArray, 28, 23, [18, 20, 52, 60, 84, 92, 116, 124]);
  const pitch = new Knob('Pitch', pitchValue);

  return new Oscilator(wave, shape, level, pitch, duty);
}

function filterFromSysEx(dataArray) {

  // cutoff
  const cutoffValue = korgValueUsingSet(dataArray, 33, 31, [34, 35, 38, 39, 42, 43, 47, 48, 50, 51, 55, 58, 62, 63, 98, 99, 102, 103, 110, 111, 114, 126, 127]);
  const cutoff = new Knob('Cutoff', cutoffValue);

  // resonance
  const resoValue = korgValueUsingSet(dataArray, 34, 31, [32, 33, 34, 37, 39, 49, 51, 53, 97, 98, 99, 109, 114]);
  const resonance = new Knob('Resonance', resoValue);

  return new Filter(cutoff, resonance);

}

function envFromSysEx(dataArray) {

  // type
  const type = new EnvelopeSwitch(dataArray[46] % 4);

  // attack
  const attackValue = korgValueUsingSet(dataArray, 35, 31, [32, 40, 41, 42, 43, 45, 47, 59, 60, 61, 107, 122, 125, 127]);
  const attack = new Knob('Attack', attackValue);

  // delay
  const decayValue = korgValueUsingSet(dataArray, 36,31, [27, 48, 49, 50, 51, 52, 53, 55, 58, 59, 61, 115, 116, 125, 127]);
  const decay = new Knob('Decay', decayValue);

  //intensity
  const sign = [32, 34, 36, 37, 39, 42, 45, 50, 52, 53, 59, 61, 98, 99, 104, 109, 114, 120, 122, 124, 125, 126, 127].includes(dataArray[31]) ? +1 : -1;
  const absIntValue = korgValueFromRaw(dataArray[37]);
  const intensity = new Knob('Intensity', absIntValue * sign);

  // target
  let targetValue = 0
  if (dataArray[39] > 80) {
    taregtValue = 2;
  } else if (dataArray[46] > 63) {
    targetValue = 1;
  }
  const target = new TargetSwitch(TargetSwitch.Type.ENVELOPE, targetValue);

  return new Envelope(type, attack, decay, intensity, target);

}

function lfoFromSysEx(dataArray) {

  // wave
  let wave;
  switch(dataArray[49] % 4) {
    case 0:
      wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.LFO, 2);
      break;
    case 1:
      wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.LFO, 1);
      break;
    case 2:
      wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.LFO, 0);
      break;
    default:
      wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.LFO, 99);
      break;
  }

  // mode
  const modeRaw = dataArray[49];
  let mode;
  if([0,1,2].includes(modeRaw)) {
    mode = new LFOModeSwitch(2);
  } else if ([4,5,6].includes(modeRaw)) {
    mode = new LFOModeSwitch(1);
  } else if ([8,9,10].includes(modeRaw)) {
    mode = new LFOModeSwitch(0);
  } else {
    mode = new LFOModeSwitch(99);
  }

  // Rate
  const rateValue = korgValueFromRaw(dataArray[38], dataArray[31] > 63)
  const rate = new Knob('Rate', rateValue);

  // Intensity
  const sign = (dataArray[39] % 2) ? +1 : -1;
  const absIntValue = korgValueFromRaw(dataArray[40]);
  const intensity = new Knob('Intensity', absIntValue * sign);

  // TargetSwitch
  let target;
  const targetRaw = dataArray[49];
  if (0 <= targetRaw && targetRaw <= 15) {
    target = new TargetSwitch(TargetSwitch.Type.LFO, 0);
  } else if (16 <= targetRaw && targetRaw <= 31) {
    target = new TargetSwitch(TargetSwitch.Type.LFO, 2);
  } else if (32 <= targetRaw && targetRaw <= 47) {
    target = new TargetSwitch(TargetSwitch.Type.LFO, 1);
  } else {
    target = new TargetSwitch(TargetSwitch.Type.LFO, 99);
  }

  return new LFO(wave, mode, rate, intensity, target);
}

function korgValueFromRaw(value, pastHalfway) {

  // halve it (using float)
  value *= 0.5;

  if (pastHalfway) {
    return Math.round((value * 1024.0 / 127.0) + 512);
  } else {
    return Math.round((value * 1024.0 / 127.0));
  }

}

function korgValueFromRawUsingSet(value, testValue, testSet) {

  const pastHalfway = testSet.includes(testValue);
  return korgValueFromRaw(value, pastHalfway);

}

function korgValueUsingSet(dataArray, valueIndex, testValueIndex, testSet) {

  return korgValueFromRawUsingSet(dataArray[valueIndex], dataArray[testValueIndex], testSet);

}

decodeSysEx(records);

module.exports = { driveFromSysEx, oscOneFromSysEx, oscTwoFromSysEx, filterFromSysEx };
