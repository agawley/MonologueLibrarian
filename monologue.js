const { bin, getBits, addLowerBits, addHighBit } = require('./utilities')

class Monologue {
  constructor(patchName, drive, oscilators, filter, envelope, lfo) {
    this.patchName = patchName;
    this.drive = drive
    this.oscilators = oscilators;
    this.filter = filter;
    this.envelope = envelope;
    this.lfo = lfo;
  }

  static createFromSysEx(data) {

    const name = data.slice(4,16).map(x => String.fromCharCode(x)).join('');
    const drive = new Knob('Drive', addLowerBits(data[29], data[35], 6));
    const oscOne = oscOneFromSysEx(data);
    const oscTwo = oscTwoFromSysEx(data);
    const filter = new Filter(new Knob('Cutoff', addLowerBits(data[22], data[33], 4)),
                              new Knob('Resonance', addLowerBits(data[23], data[33], 6)));
    const envelope = envFromSysEx(data);
    const lfo = lfoFromSysEx(data);

    return new Monologue(name, drive, [oscOne, oscTwo], filter, envelope, lfo);

    /* Convenience functions nested for privacy */

    function oscOneFromSysEx(data) {

      // Waveform
      const wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.VCO1, getBits(data[30], 6, 7));

      // Shape
      const shapeValue = addLowerBits(data[17], data[30], 2)
      const shape = new Knob('Shape', shapeValue);

      // Level
      const levelValue = addLowerBits(data[20], data[33], 0)
      const level = new Knob('Level', levelValue);

      return new Oscilator(wave, shape, level);
    }

    function oscTwoFromSysEx(data) {

      // Waveform
      const wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.VCO2, getBits(data[31], 6, 7));

      // Shape
      const shapeValue = addLowerBits(data[19], data[31], 2)
      const shape = new Knob('Shape', shapeValue);

      // Level
      const levelValue = addLowerBits(data[21], data[33], 2)
      const level = new Knob('Level', levelValue);

      // Sync
      let syncValue = getBits(data[32], 0, 1);
      const duty = new DutySwitch(syncValue);

      // pitch
      const pitchValue = addLowerBits(data[18], data[31], 0);
      const pitch = new Knob('Pitch', pitchValue);

      // Octave
      let octaveValue = getBits(data[31], 4, 5);
      const octave = new OctaveSwitch(octaveValue);

      return new Oscilator(wave, shape, level, pitch, duty, octave);
    }

    function envFromSysEx(data) {

      // type
      const type = new EnvelopeSwitch(getBits(data[34], 0, 1));

      // attack
      const attackValue = addLowerBits(data[24], data[34], 2);
      const attack = new Knob('Attack', attackValue);

      // delay
      const decayValue = addLowerBits(data[25], data[34], 4);
      const decay = new Knob('Decay', decayValue);

      //intensity
      const absIntValue = addLowerBits(data[26], data[35], 0);
      const intensity = new Knob('Intensity', absIntValue-512);

      // target
      const target = new TargetSwitch(TargetSwitch.Type.ENVELOPE, getBits(data[34], 6, 7));

      return new Envelope(type, attack, decay, intensity, target);

    }

    function lfoFromSysEx(data) {

      // wave
      const wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.LFO, getBits(data[36], 0, 1));

      // mode
      const modeRaw = getBits(data[36], 2, 3);
      const mode = new LFOModeSwitch(modeRaw);

      // Rate
      const rateValue = addLowerBits(data[27], data[35], 2);
      const rate = new Knob('Rate', rateValue);

      // Intensity
      const absIntValue = addLowerBits(data[28], data[35], 4);
      const intensity = new Knob('Intensity', absIntValue-512);

      // TargetSwitch
      const target = new TargetSwitch(TargetSwitch.Type.LFO, getBits(data[36], 4, 5));

      return new LFO(wave, mode, rate, intensity, target);
    }


  }

  toString() {
    return `Monologue Patch ${this.patchName}\n---------\nDrive: ${this.drive}\nVCO1:\n${this.oscilators[0]}\nVCO2:\n${this.oscilators[1]}\nFilter:\n${this.filter}\nEnvelope:\n${this.envelope}\nLFO:\n${this.lfo}\n\n`;
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

// TODO: work out smooth function for Pitch
class PitchKnob extends Knob {
  constructor(value) {
    super('Pitch', value);
  }

  getReadableValue() {
    if (this.value < 4) {
      return -1200;
    } else if (4 <= this.value < 356) {
      return -1200 + ((1200 - 256) * (this.value - 4) / 352);
    } else if (356 <= this.value < 476) {
      return -256 + ((256 - 16) * (this.value - 356) / 120);
    } else if (476 <= this.value < 492) {
      return -16 + (16 * (this.value - 375) / 16);
    } else if (492 <= this.value < 532) {
      return 0
    } else if (this.value >= 1020) {
      return 1200;
    } else if (668 <= this.value < 1020) {
      return 256 + ((1200 - 256) * (this.value - 668) / 352);
    } else if (548 <= this.value < 668) {
      return 16 + ((256 - 16) * (this.value - 548) / 120);
    } else if (532 <= this.value < 548) {
      return 0 + (16 * (this.value - 532) / 16);
    }
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
      case 3:
        return 'Sawtooth';
      case 1:
        return 'Triangle';
      case 0:
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
  getReadableValue() {
    switch(this.value) {
      case 0:
        return '16"';
      case 1:
        return '8"';
      case 2:
        return '4"';
      case 3:
        return '2"';
      default:
        return 'Unknown';
    }
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
          return 'AGD';
          break;
        case 2:
          return 'AD';
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
      case 1:
        return this.type == TargetSwitch.Type.LFO ? 'Shape' : 'Pitch 2'
      case 2:
        return 'Pitch';
      default:
        return "Unknown"
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
        return '1-Shot';
        break;
      case 1:
        return 'Slow';
        break;
      case 2:
        return 'Fast';
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

module.exports = Monologue;
