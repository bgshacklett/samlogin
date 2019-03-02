/* global describe it */
/* eslint-env mocha */
const expect = require('unexpected');
const mock   = require('./mock.js');

const index  = require('../index.js');

describe(
  '#onBeforeRequestEvent(...)',
  () => {
    describe("When a role can't be assumed...", () => {
      const mockLibSts = mock.libStsNull;
      const mockConfig = {
                            AccountAliases: [
                             {
                               AccountNumber: mock.accountNumber.lab,
                               Alias:         'Lab',
                             },
                           ],
                         };

      it('Discards nulls...', async () => {
        expect(
                index.onBeforeRequestEvent,
                'when called with',
                [
                  mock.qs,
                  {},
                  mockConfig,
                  new mock.Logger(new mock.Log(), 'info'),
                  mock.AWS,
                  mock.LibSaml,
                  mockLibSts,
                  mock.docBuilder,
                  mock.docWriter,
                ],
                'not to throw',
              );
      });
    });
  },
);
