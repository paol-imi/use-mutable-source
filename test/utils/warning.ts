import * as module from '../../src/warning';

export const warning = vi
  .spyOn(module, 'warning')
  .mockImplementation(() => void 0);

beforeEach(() => {
  module.warnings.clear();
  warning.mockClear();
});
