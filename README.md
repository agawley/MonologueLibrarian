# MonologueLibrarian

**To see your current patch...**

On your computer:
`git clone https://github.com/agawley/MonologueLibrarian.git
cd MonologueLibrarian
yarn
node index.js`

On the Monologue:
`Edit Mode > Program Edit > Program Dump > Write`

**Sample output**

Monologue Patch Init Program
---------

Drive: Knob { name: Drive, value: 831}
VCO1:
        Wave: Switch { name: VCO1, value: Square}
        Shape: Knob { name: Shape, value: 711}
        Level: Knob { name: Level, value: 835}
        Pitch: Knob { name: Pitch, value: 0}
        Duty: Switch { name: Duty, value: None}
        Octave: Switch { name: Octave, value: 16"}
VCO2:
        Wave: Switch { name: VCO2, value: Noise}
        Shape: Knob { name: Shape, value: 796}
        Level: Knob { name: Level, value: 301}
        Pitch: Knob { name: Pitch, value: 769}
        Duty: Switch { name: Duty, value: Sync}
        Octave: Switch { name: Octave, value: 4"}
Filter:
        Cutoff: Knob { name: Cutoff, value: 192}
        Resonance: Knob { name: Resonance, value: 716}

Envelope:
        Type: Switch { name: Envelope, value: AGD}
        Attack: Knob { name: Attack, value: 261}
        Decay: Knob { name: Decay, value: 888}
        Int: Knob { name: Intensity, value: 246}
        Target: Switch { name: Envelope, value: Pitch 2}
LFO:
        Wave: Switch { name: LFO, value: Triangle}
        Mode: Switch { name: LFO Mode, value: Slow}
        Rate: Knob { name: Rate, value: 96}
        Int: Knob { name: Intensity, value: 73}
        Target: Switch { name: LFO, value: Shape}
Misc Params:
        BPM Sync: Switch { name: BPM Sync, value: On%}
        Portament Mode: Switch { name: Portament Mode, value: On%}
        Portament Time: Knob { name: Potament Time, value: 14}
        Cutoff Velocity: Switch { name: Cutoff Velocity, value: 100%}
        Cutoff Key Track: Switch { name: Cutoff Key Track, value: 50%}
        Slider Assign: Switch { name: Slider Assign, value: VCO 1 SHAPE}
