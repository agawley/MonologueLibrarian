const monologue = require('../index');

describe('Monologue tests', () => {
  describe('Drive', () => {
    it('returns the correct value in lower range', () => {
      let sysexLow = [];
      sysexLow[41] = 29;
      sysexLow[39] = 85;
      expect(monologue.driveFromSysEx(sysexLow).getReadableValue()).toEqual(120);
    });
    it('returns the correct value in upper range', () => {
      let sysexLow = [];
      sysexLow[41] = 29;
      sysexLow[39] = 23;
      expect(monologue.driveFromSysEx(sysexLow).getReadableValue()).toEqual(120+512);
    });
  });
  /*describe('VCO2', () => {
    it('returns the correct pitch value in lower range', () => {
      let sysexLow = [];
      sysexLow[28] = 29;
      sysexLow[23] = 85;
      expect(monologue.oscTwoFromSysEx(sysexLow).pitch.getReadableValue()).toEqual(120);
    });
    it('returns the correct pitch value in upper range', () => {
      let sysexLow = [];
      sysexLow[28] = 29;
      sysexLow[23] = 23;
      expect(monologue.oscTwoFromSysEx(sysexLow).pitch.getReadableValue()).toEqual(120+512);
    });
  });*/
  describe('Filter', () => {
    it('returns the correct value when both cutoff and resonance are in lower range', () => {
      let sysexLow = [];
      sysexLow[31] = 30;
      sysexLow[33] = 29;
      sysexLow[34] = 29;
      expect(monologue.filterFromSysEx(sysexLow).cutoff.getReadableValue()).toEqual(120);
      expect(monologue.filterFromSysEx(sysexLow).resonance.getReadableValue()).toEqual(120);
    });
    it('returns the correct value when both cutoff and resonance are in upper range', () => {
      let sysexLow = [];
      sysexLow[31] = 34;
      sysexLow[33] = 29;
      sysexLow[34] = 29;
      expect(monologue.filterFromSysEx(sysexLow).cutoff.getReadableValue()).toEqual(120+512);
      expect(monologue.filterFromSysEx(sysexLow).resonance.getReadableValue()).toEqual(120+512);
    });
    it('returns the correct value when cutoff high and resonance low', () => {
      let sysexLow = [];
      sysexLow[31] = 35;
      sysexLow[33] = 29;
      sysexLow[34] = 29;
      expect(monologue.filterFromSysEx(sysexLow).cutoff.getReadableValue()).toEqual(120+512);
      expect(monologue.filterFromSysEx(sysexLow).resonance.getReadableValue()).toEqual(120);
    });
    it('returns the correct value when cutoff low and resonance high', () => {
      let sysexLow = [];
      sysexLow[31] = 32;
      sysexLow[33] = 29;
      sysexLow[34] = 29;
      expect(monologue.filterFromSysEx(sysexLow).cutoff.getReadableValue()).toEqual(120);
      expect(monologue.filterFromSysEx(sysexLow).resonance.getReadableValue()).toEqual(120+512);
    });
  });

});
