/* global describe it */
/* eslint-env mocha */
const expect     = require('unexpected');
const sts        = require('../sts.js');

/* eslint-disable no-console */
const MOCK_LOGGER = {
                      info: (message) => {
                              console.log(`Function output: ${message}`);
                            },
                    };

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
                                Alias:         'Lab',
                              },
                            ],
                          };

      it('Returns an Assumed Role Object', async () => {
        const actual = await sts.assumeRole(
          MOCK_CONFIG,
          MOCK_LOGGER,
          MOCK_STS,
          MOCK_ROLE_ATTRIBUTE_VALUE,
          MOCK_SAML_ASSERTION,
        );

        expect(
          actual,
          'to equal',
          {
            accountNumber: '012345678910',
            roleName:      'MockRole',
            credentials:   MOCK_CREDENTIALS,
          },
        );
      });
    });
  },
);
