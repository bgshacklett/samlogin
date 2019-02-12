/* global describe it */
/* eslint-env mocha */
const expect     = require('unexpected');
const sts        = require('../sts.js');

const MOCK_ACCOUNT_ALIAS        = 'Lab'
const MOCK_ROLE_ATTRIBUTE_VALUE = 'arn:aws:iam::012345678910:role/MockRole,arn:aws:iam::012345678910:saml-provider/providername';
const MOCK_SAML_ASSERTION       = '';
const MOCK_CREDENTIALS          = {
                                    accessKeyId:  '',
                                    secretKey:    '',
                                    SessionToken: '',
                                  };

const MOCK_STS = {
  /* eslint-disable no-unused-vars */
  assumeRoleWithSAML: params => ({
                                  promise: async () => ({
                                    Credentials: MOCK_CREDENTIALS,
                                  }),
                                }),
};

describe(
  '#assumeRole(config, logger, STS, roleAttributeValue, SAMLAssertion)',
  () => {
    describe('With Alias', () => {
      const MOCK_CONFIG = {
                            AccountAliases: [
                              {
                                AccountNumber: '012345678910',
                                Alias:         MOCK_ACCOUNT_ALIAS,
                              },
                            ],
                          };

      const log = [];

      /* eslint-disable no-console */
      const MOCK_LOGGER = {
                            info: (message) => {
                                    log.push(message);
                                  },
                          };

      it('Returns an Assumed Role Object', async () => {
        const actual = await sts.assumeRole(
          MOCK_CONFIG,
          MOCK_LOGGER,
          MOCK_STS,
          MOCK_ROLE_ATTRIBUTE_VALUE,
          MOCK_SAML_ASSERTION,
        );

        expect(actual, 'to equal', {
                                     accountNumber: '012345678910',
                                     roleName:      'MockRole',
                                     credentials:   MOCK_CREDENTIALS,
                                   });
      });

      it('Logs the correct account name', async () => {
        expect(log[0], 'to contain', MOCK_ACCOUNT_ALIAS);
        expect(log[1], 'to contain', MOCK_ACCOUNT_ALIAS);
      });
    });
  },
);
