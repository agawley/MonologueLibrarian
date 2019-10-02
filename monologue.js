const { bin, getBits, addLowerBits } = require('./utilities');

Array.prototype.toString = function() {
  return this.join('');
};

class Monologue {

  constructor(patchName, drive, oscilators, filter, envelope, lfo, misc, sequencer) {
    this.patchName = patchName;
    this.drive = drive;
    this.oscilators = oscilators;
    this.filter = filter;
    this.envelope = envelope;
    this.lfo = lfo;
    this.misc = misc;
    this.sequencer = sequencer;
  }


  static createFromSysEx(data) {

    const SLIDER_ASSIGN_MATRIX = {
      13 : 'VCO 1 PITCH',
      14 : 'VCO 1 SHAPE',
      17 : 'VCO 2 PITCH',
      18 : 'VCO 2 SHAPE',
      21 : 'VCO 1 LEVEL',
      22 : 'VCO 1 LEVEL',
      23 : 'CUTOFF',
      24 : 'RESONANCE',
      26 : 'ATTACK',
      27 : 'DECAY',
      28 : 'EG INT',
      31 : 'LFO RATE',
      32 : 'LFO INT',
      40 : 'PORTAMENT',
      56 : 'PITCH BEND',
      57 : 'GATE TIME'
    };

    const name = data.slice(4,16).map(x => String.fromCharCode(x)).join('');
    const drive = new Knob('Drive', addLowerBits(data[29], data[35], 6));
    const oscOne = oscOneFromSysEx(data);
    const oscTwo = oscTwoFromSysEx(data);
    const filter = new Filter(new Knob('Cutoff', addLowerBits(data[22], data[33], 4)),
                              new Knob('Resonance', addLowerBits(data[23], data[33], 6)));
    const envelope = envFromSysEx(data);
    const lfo = lfoFromSysEx(data);
    const misc = new MiscParams(new OnOffSwitch('BPM Sync', getBits(data[44], 3, 3)),
                                new OnOffSwitch('Portament Mode', getBits(data[44], 0, 0)),
                                new Knob('Potament Time', data[41]),
                                new PercentSwitch('Cutoff Velocity', getBits(data[44], 4, 5)),
                                new PercentSwitch('Cutoff Key Track', getBits(data[44], 6, 7)),
                                new Switch('Slider Assign', SLIDER_ASSIGN_MATRIX[data[42]]));
    const sequencer = sequencerFromSysEx(data);

    return new Monologue(name, drive, [oscOne, oscTwo], filter, envelope, lfo, misc, sequencer);

    /* Convenience functions nested for privacy */

    function oscOneFromSysEx(data) {

      // Waveform
      const wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.VCO1, getBits(data[30], 6, 7));

      // Shape
      const shapeValue = addLowerBits(data[17], data[30], 2);
      const shape = new Knob('Shape', shapeValue);

      // Level
      const levelValue = addLowerBits(data[20], data[33], 0);
      const level = new Knob('Level', levelValue);

      return new Oscilator(wave, shape, level);
    }

    function oscTwoFromSysEx(data) {

      // Waveform
      const wave = new WaveTypeSwitch(WaveTypeSwitch.OSCILATOR.VCO2, getBits(data[31], 6, 7));

      // Shape
      const shapeValue = addLowerBits(data[19], data[31], 2);
      const shape = new Knob('Shape', shapeValue);

      // Level
      const levelValue = addLowerBits(data[21], data[33], 2);
      const level = new Knob('Level', levelValue);

      // Sync
      const syncValue = getBits(data[32], 0, 1);
      const duty = new DutySwitch(syncValue);

      // pitch
      const pitchValue = addLowerBits(data[18], data[31], 0);
      const pitch = new Knob('Pitch', pitchValue);

      // Octave
      const octaveValue = getBits(data[31], 4, 5);
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

    function sequencerFromSysEx(data) {

      const MOTION_PARAM_MATRIX = {
        0 : 'None',
        13 : 'VCO 1 PITCH',
        14 : 'VCO 1 SHAPE',
        15 : 'VCO 1 OCTAVE',
        16 : 'VCO 1 WAVE',
        17 : 'VCO 2 PITCH',
        18 : 'VCO 2 SHAPE',
        19 : 'VCO 2 OCTAVE',
        20 : 'VCO 2 WAVE',
        21 : 'VCO 1 LEVEL',
        22 : 'VCO 2 LEVEL',
        23 : 'CUTOFF',
        24 : 'RESONANCE',
        25 : 'SYNC/RING',
        26 : 'ATTACK',
        27 : 'DECAY',
        28 : 'EG INT',
        29 : 'EG TYPE',
        30 : 'EG TARGET',
        31 : 'LFO RATE',
        32 : 'LFO INT',
        33 : 'LFO TARGET',
        34 : 'LFO TYPE',
        35 : 'LFO MODE',
        37 : 'DRIVE',
        40 : 'PORTAMENT',
        56 : 'PITCH BEND',
        57 : 'GATE TIME'
      };

      const steps = [];
      for (let i = 0; i < 16; i++) {
        const note = new Note(new Key(data[96+(i*22)]),
                            new Knob("Velocity", data[96+2+(i*22)]),
                            new GateTimeKnob(getBits(data[96+4+(i*22)],0,6)),
                            new OnOffSwitch('Trigger', getBits(data[96+4+(i*22)],7,7)));
        const motionSlotsData = [[],[],[],[]];
        for (let j = 0; j < 4; j++) {
          motionSlotsData[j].push(new Knob(`Motion Slot ${j+1} Data 1`, data[96+6+(j*4)+(i*22)]));
          motionSlotsData[j].push(new Knob(`Motion Slot ${j+1} Data 2`, data[96+7+(j*4)+(i*22)]));
          motionSlotsData[j].push(new Knob(`Motion Slot ${j+1} Data 3`, data[96+8+(j*4)+(i*22)]));
          motionSlotsData[j].push(new Knob(`Motion Slot ${j+1} Data 4`, data[96+9+(j*4)+(i*22)]));
          // add the tabs to each motionSlotData Array toString method. Ugly Hack Alert!
          motionSlotsData[j].toString = function () { return this.join('\t'); };
        }
        // add the tabs to the motionSlotsData Array toString method. Ugly Hack Alert!
        motionSlotsData.toString = function () { return this.join('\t'); };
        const sequencerEvent = new SequencerEvent(note, motionSlotsData);
        const step = new Step((i+1),
                            new OnOffSwitch(`On/Off`, getBits(data[64+Math.floor(i/16)],i%8,i%8)),
                            new OnOffSwitch(`Motion On/Off`, getBits(data[66+Math.floor(i/16)],i%8,i%8)),
                            new OnOffSwitch(`Slide On/Off`, getBits(data[68+Math.floor(i/16)],i%8,i%8)),
                            sequencerEvent);
        steps.push(step);
      }
      const motionSlotParams = [];
      for (let i = 0; i < 4; i++) {
        motionSlotParams.push(new MotionSlotParams((i+1),
                             new OnOffSwitch('On/Off', getBits(data[72+(i*2)],0,0)),
                             new OnOffSwitch('Smooth On/Off', getBits(data[72+(i*2)],1,1)),
                             new Switch('Parameter', MOTION_PARAM_MATRIX[data[73+(i*2)]])));
      }

      const bpm = parseInt(bin(getBits(data[53],0,3)) + bin(data[52]),2)/10;

      return new Sequencer(new Knob('BPM', bpm),
                              new Knob('Step Length', data[54]),
                              new StepResolutionSwith(data[55]),
                              new Knob('Swing', data[56] > 75 ? data[56] - 256 : data[56]),
                              new Knob('Default Gate Time', data[57]/72),
                              motionSlotParams,
                              steps);
    }

  }

  toString() {
    return `MONOLOGUE PATCH: ${this.patchName}\n----------------------------\n\n${this.drive}VCO1:\n${this.oscilators[0]}VCO2:\n${this.oscilators[1]}Filter:\n${this.filter}Envelope:\n${this.envelope}LFO:\n${this.lfo}Misc Params:\n${this.misc}\n${this.sequencer}`;
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
    return `${this.name}: ${this.getReadableValue()}\n`;
  }

  getName() {
    return this.name;
  }
}

class Key extends Knob {
  constructor(value) {
    super('Key', value);
  }

  getReadableValue() {
    const octave = Math.floor((this.value / 12) - 1);
    const noteName = 'C C#D D#E F F#G G#A A#B '.substr((this.value % 12) * 2, 2);
    return octave >= 0 ? noteName.trim() + octave : '--';
  }

}

class GateTimeKnob extends Knob {
  constructor(value) {
    super('GateTime', value);
  }

  getReadableValue() {
    return this.value < 73 ? `${Math.floor(this.value * 100 / 72)}%` : 'TIE';
  }
}

// TODO: work out smooth function for Pitch
/*class PitchKnob extends Knob {
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

}*/

class Switch extends Knob {
  constructor(name, value) {
    super(name, value);
  }

  toString() {
    return `${this.name}: ${this.getReadableValue()}\n`;
  }
}

class PercentSwitch extends Switch {
  constructor(name, value) {
    super(name, value);
  }

  getReadableValue() {
    return `${this.value * 50}%`;
  }
}

class OnOffSwitch extends Switch {
  constructor(name, value) {
    super(name, value);
  }

  getReadableValue() {
    return `${this.value ? 'On' : 'Off'}`;
  }
}

class StepResolutionSwith extends Switch {
  constructor(value) {
    super('Step Resolution', value);
  }

  getReadableValue() {
    return `1/${2^this.value}`;
  }
}

class WaveTypeSwitch extends Switch {
  constructor(oscilator, value) {
    super('Wave', value);
    this.oscilator = oscilator;
  }

  getReadableValue() {
    switch(this.value) {
      case 2:
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
    super('Envelope Type', value);
  }

  getReadableValue() {
      switch(this.value) {
        case 0:
          return 'Gate';
        case 1:
          return 'AGD';
        case 2:
          return 'AD';
        default:
          return 'Unknown';
      }
  }

}

class TargetSwitch extends Switch {
  constructor(type, value) {
    super('Target', value);
    this.type = type;
  }

  getReadableValue() {
    switch(this.value) {
      case 0:
        return 'Cutoff';
      case 1:
        return this.type == TargetSwitch.Type.LFO ? 'Shape' : 'Pitch 2';
      case 2:
        return 'Pitch';
      default:
        return "Unknown";
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
      case 1:
        return 'Slow';
      case 2:
        return 'Fast';
      default:
        return 'Unknown';
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
    return `\t${this.wave}\t${this.shape}\t${this.level}\t${this.pitch}\t${this.duty}\t${this.octave}`;
  }

}

class Filter {
  constructor(cutoff, resonance) {
    this.cutoff = cutoff;
    this.resonance = resonance;
  }

  toString() {
    return `\t${this.cutoff}\t${this.resonance}`;
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
    return `\t${this.type}\t${this.attack}\t${this.decay}\t${this.intensity}\t${this.target}`;
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
    return `\t${this.wave}\t${this.mode}\t${this.rate}\t${this.intensity}\t${this.target}`;
  }
 }

class MiscParams {
  constructor(bpmSync, portamentMode, portamentTime, cutoffVelocity, cutoffKeyTrack, sliderAssign) {
    this.bpmSync = bpmSync;
    this.portamentMode = portamentMode;
    this.portamentTime = portamentTime;
    this.cutoffVelocity = cutoffVelocity;
    this.cutoffKeyTrack = cutoffKeyTrack;
    this.sliderAssign = sliderAssign;
  }

  toString() {
    return `\t${this.bpmSync}\t${this.portamentMode}\t${this.portamentTime}\t${this.cutoffVelocity}\t${this.cutoffKeyTrack}\t${this.sliderAssign}`;
  }

}

class Sequencer {
  constructor(bpm, stepLength, stepResolution, swing, defaultGateTime, motionSlotParams, steps) {
    this.bpm = bpm;
    this.stepLength = stepLength;
    this.stepResolution = stepResolution;
    this.swing = swing;
    this.defaultGateTime = defaultGateTime;
    this.motionSlotParams = motionSlotParams; // 4 slot array
    this.steps = steps; // 16 slot array
  }

  toString() {
    return `SEQUENCER\n---------\n${this.bpm}${this.stepLength}${this.stepResolution}${this.swing}${this.defaultGateTime}\n${this.motionSlotParams}${this.steps}`;
  }
}



class MotionSlotParams {
  constructor(slotNumber, active, smooth, parameter) {
    this.slotNumber = slotNumber;
    this.active = active;
    this.smooth = smooth;
    this.parameter = parameter;
  }

  toString() {
    return `Motion Slot ${this.slotNumber}\n\t${this.active}\t${this.smooth}\t${this.parameter}\n`;
  }
}

class Step {
  constructor(stepNumber, active, motionActive, slideActive, event) {
    this.stepNumber = stepNumber;
    this.active = active;
    this.motionActive = motionActive;
    this.slideActive = slideActive;
    this.event = event;
  }

  toString() {
    return `Step ${this.stepNumber}\n\t${this.active}\t${this.motionActive}\t${this.slideActive}\n${this.event}`;
  }
}

class SequencerEvent {
  constructor(note, motionSlotsData) {
    this.note = note;
    this.motionSlotsData = motionSlotsData; // 4-Array of 4-Arrays
  }

  toString() {
    return `${this.note}\n\t${this.motionSlotsData}\n`;
  }
}

class Note {
  constructor(key, velocity, gateTime, trigger) {
    this.key = key;
    this.velocity = velocity;
    this.gateTime = gateTime;
    this.trigger = trigger;
  }

  toString() {
    return `\t${this.key}\t${this.velocity}\t${this.gateTime}\t${this.trigger}`;
  }
}




module.exports = Monologue;
