/* global describe it */
/* eslint-env mocha */
const expect     = require('unexpected');
const sts        = require('../sts.js');

const MOCK_SAML_ASSERTION = '';
const MOCK_CREDENTIALS    = {
                              accessKeyId:  '',
                              secretKey:    '',
                              SessionToken: '',
                            };

const MOCK_ACCOUNT_NUMBER = {
                              lab:  '012345678910',
                              sbx:  '123456789101',
                              dev:  '234567891012',
                              prod: '345678910123',
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
    describe('With a Single Alias Configured...', () => {
      describe('When the role matches the alias...', () => {
        const MOCK_ROLE_ATTRIBUTE_VALUE = `arn:aws:iam::${MOCK_ACCOUNT_NUMBER.lab}:role/MockRole,arn:aws:iam::${MOCK_ACCOUNT_NUMBER.lab}:saml-provider/providername`;
        const MOCK_CONFIG = {
                              AccountAliases: [
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.lab,
                                  Alias:         'Lab',
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
                                       accountNumber: MOCK_ACCOUNT_NUMBER.lab,
                                       roleName:      'MockRole',
                                       credentials:   MOCK_CREDENTIALS,
                                     });
        });

        it('Logs the correct account name', async () => {
          expect(log[0], 'to be ok');
          expect(log[0], 'to contain', 'Lab');
          expect(log[1], 'to contain', 'Lab');
        });
      });

      describe('When the role does not match the alias...', () => {
        const MOCK_ROLE_ATTRIBUTE_VALUE = `arn:aws:iam::${MOCK_ACCOUNT_NUMBER.sbx}:role/MockRole,arn:aws:iam::${MOCK_ACCOUNT_NUMBER.sbx}:saml-provider/providername`;
        const MOCK_CONFIG = {
                              AccountAliases: [
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.lab,
                                  Alias:         'Lab',
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
                                       accountNumber: MOCK_ACCOUNT_NUMBER.sbx,
                                       roleName:      'MockRole',
                                       credentials:   MOCK_CREDENTIALS,
                                     });
        });

        it('Logs the correct account name', async () => {
          expect(log[0], 'to be ok');
          expect(log[0], 'to contain', MOCK_ACCOUNT_NUMBER.sbx);
          expect(log[1], 'to contain', MOCK_ACCOUNT_NUMBER.sbx);
        });
      });
    });

    describe('With Multiple Aliases Configured...', () => {
      describe('When the role matches an alias...', () => {
        const MOCK_ROLE_ATTRIBUTE_VALUE = `arn:aws:iam::${MOCK_ACCOUNT_NUMBER.lab}:role/MockRole,arn:aws:iam::${MOCK_ACCOUNT_NUMBER.lab}:saml-provider/providername`;
        const MOCK_CONFIG = {
                              AccountAliases: [
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.lab,
                                  Alias:         'Lab',
                                },
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.sbx,
                                  Alias:         'Sandbox',
                                },
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.dev,
                                  Alias:         'Dev',
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
                                       accountNumber: MOCK_ACCOUNT_NUMBER.lab,
                                       roleName:      'MockRole',
                                       credentials:   MOCK_CREDENTIALS,
                                     });
        });

        it('Logs the correct account name', async () => {
          expect(log[0], 'to be ok');
          expect(log[0], 'to contain', 'Lab');
          expect(log[1], 'to contain', 'Lab');
        });
      });

      describe('When the role does not match any aliases...', () => {
        const MOCK_ROLE_ATTRIBUTE_VALUE = `arn:aws:iam::${MOCK_ACCOUNT_NUMBER.prod}:role/MockRole,arn:aws:iam::${MOCK_ACCOUNT_NUMBER.prod}:saml-provider/providername`;
        const MOCK_CONFIG = {
                              AccountAliases: [
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.lab,
                                  Alias:         'Lab',
                                },
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.sbx,
                                  Alias:         'Sandbox',
                                },
                                {
                                  AccountNumber: MOCK_ACCOUNT_NUMBER.dev,
                                  Alias:         'Dev',
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
                                       accountNumber: MOCK_ACCOUNT_NUMBER.prod,
                                       roleName:      'MockRole',
                                       credentials:   MOCK_CREDENTIALS,
                                     });
        });

        it('Logs the correct account name', async () => {
          expect(log[0], 'to be ok');
          expect(log[0], 'to contain', MOCK_ACCOUNT_NUMBER.prod);
          expect(log[1], 'to contain', MOCK_ACCOUNT_NUMBER.prod);
        });
      });
    });
  },
);
