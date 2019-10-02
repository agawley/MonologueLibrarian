const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const transformDataFrom7BitTo8Bit = require('../utilities').transformDataFrom7BitTo8Bit;
const Monologue = require('../monologue');

const file = fs.readFileSync('./__tests__/sample_program_dump.csv', 'utf8');

describe('Snapshot test', () => {
    it('renders the sample_program_dump correctly', () => {
      const records = parse(file, [])[0];
      const data = transformDataFrom7BitTo8Bit(records);
      expect(Monologue.createFromSysEx(data).toString()).toMatchSnapshot();
    });
  });
