const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const assert = require('assert');

// data.csv is just the output of console.log-ing the WebMidi output of the SysEx dump from the Minilogue
var file = fs.readFileSync('./data1.csv', 'utf8');
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
    return `Monologue Patch ${this.patchNumber}\n---------\nDrive: ${this.drive}\nVCO1:\n${this.oscilators[0]}\nVCO2:\n${this.oscilators[1]}\nFilter:\n${this.filter}\nEnvelope:\n${this.envelope}\nLFO:\n${this.lfo}\n\n`;
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
        return 'Ring';
      case 1:
        return 'None';
      case 2:
        return 'Sync';
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
  constructor(wave, shape, level, pitch, duty, octave) {
    this.wave = wave;
    this.shape = shape;
    this.level = level;
    this.pitch = pitch || new Knob('Pitch', 0);
    this.duty = duty || new DutySwitch(1);
    this.octave = octave || new OctaveSwitch(0);
  }

  toString() {
    return `\tWave: ${this.wave}\n\tShape: ${this.shape}\n\tLevel: ${this.level}\n\tPitch: ${this.pitch}\n\tDuty: ${this.duty}\n\tOctave: ${this.octave}`;
  }

}

class Filter {
  constructor(cutoff, resonance) {
    this.cutoff = cutoff;
    this.resonance = resonance;
  }

  toString() {
    return `\tCutoff: ${this.cutoff}\n\tResonance: ${this.resonance}\n`;
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

  let array = [];

  for (let dataArray of data) {

    dataArray = dataArray.map(x => x * 1);
    //dataArray.splice(8,1); // remove global sesyex fields
    //dataArray.splice(9,1);
    const drive = driveFromSysEx(dataArray);
    const oscOne = oscOneFromSysEx(dataArray);
    const oscTwo = oscTwoFromSysEx(dataArray);
    const filter = filterFromSysEx(dataArray);
    const envelope = envFromSysEx(dataArray);
    const lfo = lfoFromSysEx(dataArray);

    const monologue = new Monologue(dataArray[7], drive, [oscOne, oscTwo], filter, envelope, lfo);

    console.log(monologue.toString());
  }

}

function driveFromSysEx(dataArray) {
  console.log(dataArray[41]);
  console.log(dataArray[41]);
  const value = korgValueFromRaw(dataArray[41], dataArray[39] % 4 >= 2);
  return new Knob('Drive', value);
}

function oscOneFromSysEx(dataArray) {

  // Waveform
  let waveValue = 0; // Sawtooth
  if(dataArray[42] % 128 >= 64) {
    waveValue = 1; // Triangle
  } else if (dataArray[39] % 8 < 4) {
    waveValue = 2; // Square
  }
  const wave = new WaveTypeSwitch(0, waveValue);

  // Shape
  // TODO: there is another value involved here but I don't understand how
  const shapeValue = korgValueFromRaw(dataArray[27], dataArray[23] % 16 >= 8);
  const shape = new Knob('Shape', shapeValue);

  // level
  const levelValue = korgValueFromRaw(dataArray[30], dataArray[23] % 128 >= 64);
  const level = new Knob('Level', levelValue);

  return new Oscilator(wave, shape, level);
}

function oscTwoFromSysEx(dataArray) {

  // Waveform
  let waveValue = 0; // Sawtooth
  if(dataArray[43] % 128 >= 64) {
    waveValue = 1; // Triangle
  } else if (dataArray[39] % 16 < 4) {
    waveValue = 2; // Noise
  }
  const wave = new WaveTypeSwitch(1, waveValue);

  // Shape

  const shapeValue = korgValueFromRaw(dataArray[29], dataArray[23] % 64 >= 32);
  const shape = new Knob('Shape', shapeValue);

  // level
  const levelValue = korgValueFromRaw(dataArray[32], dataArray[31] % 2 != 0);
  const level = new Knob('Level', levelValue);

  // Sync
  let syncValue = dataArray[44] % 4;
  const duty = new DutySwitch(syncValue);

  // pitch
  // TODO: there is another value involved here but I don't understand how
  const pitchValue = korgValueFromRaw(dataArray[28], dataArray[23] % 32 >= 16);
  const pitch = new Knob('Pitch', pitchValue);

  // Octave
  let octaveValue = 3;
  if (dataArray[43] % 64 < 16) {
    octaveValue = 0;
  } else if (dataArray[43] % 64 < 32) {
    octaveValue = 1;
  } else if (dataArray[43] % 64 < 48) {
    octaveValue = 2;
  }
  const octave = new OctaveSwitch(octaveValue);

  return new Oscilator(wave, shape, level, pitch, duty, octave);
}

function filterFromSysEx(dataArray) {

  // cutoff
  const cutoffValue = korgValueFromRaw(dataArray[33], dataArray[31] % 4 >= 2);
  const cutoff = new Knob('Cutoff', cutoffValue);

  // resonance
  const resoValue = korgValueFromRaw(dataArray[34], dataArray[31] % 8 >= 4);
  const resonance = new Knob('Resonance', resoValue);

  return new Filter(cutoff, resonance);

}

function envFromSysEx(dataArray) {

  // type
  const type = new EnvelopeSwitch(dataArray[46] % 4);

  // attack
  const attackValue = korgValueFromRaw(dataArray[35], dataArray[31] % 16 >= 8);
  const attack = new Knob('Attack', attackValue);

  // delay
  const decayValue = korgValueFromRaw(dataArray[36] ,dataArray[31] % 32 >= 16);
  const decay = new Knob('Decay', decayValue);

  //intensity
  const sign = ((dataArray[31] % 64) >= 32) ? +1 : -1;
  const absIntValue = korgValueFromRaw(dataArray[37]);
  const intensity = new Knob('Intensity', absIntValue * sign);

  // target
  let targetValue = 0
  if (dataArray[39] % 128 >= 64) {
    taregtValue = 1;
  } else if (dataArray[46] % 128 >= 64) {
    targetValue = 2;
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
  let mode = new LFOModeSwitch(2);
  if(dataArray[49] % 16 >= 8) {
    mode = new LFOModeSwitch(0);
  } else if (dataArray[49] % 16 >= 4) {
    mode = new LFOModeSwitch(1);
  }

  // Rate
  const rateValue = korgValueFromRaw(dataArray[38], dataArray[31] % 128 >= 64)
  const rate = new Knob('Rate', rateValue);

  // Intensity
  const sign = (dataArray[39] % 2) ? +1 : -1;
  const absIntValue = korgValueFromRaw(dataArray[40]);
  const intensity = new Knob('Intensity', absIntValue * sign);

  // TargetSwitch
  let target = new TargetSwitch(TargetSwitch.Type.LFO, 0);
  const targetRaw = dataArray[49];
  if (dataArray[49] % 64 >= 32) {
    target = new TargetSwitch(TargetSwitch.Type.LFO, 1);
  } else if (dataArray[49] % 64 >= 16) {
    target = new TargetSwitch(TargetSwitch.Type.LFO, 2);
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

decodeSysEx(records);

module.exports = { driveFromSysEx, oscOneFromSysEx, oscTwoFromSysEx, filterFromSysEx };
