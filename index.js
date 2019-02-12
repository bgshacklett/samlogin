#!/usr/bin/env node

// ************
const AWS              = require('aws-sdk');
const chalk            = require('chalk');
const fs               = require('fs');
const homedir          = require('os').homedir();
const path             = require('path');
const puppeteer        = require('puppeteer');
const yaml             = require('js-yaml');
const { URL }          = require('url');
const { parse }        = require('querystring');
const LibSaml          = require('libsaml');
const locatePath       = require('locate-path');
const parseArgs        = require('minimist');
const { stripIndents } = require('common-tags');
const winston          = require('winston');


// **************************
// Global configuration items
// **************************


// *********
// Functions
// *********
async function createCredentialBlock(identity) {
  const { accountNumber, roleName, credentials } = await identity;

  return (stripIndents`[${accountNumber}-${roleName}]
           aws_access_key_id = ${credentials.AccessKeyId}
           aws_secret_access_key = ${credentials.SecretAccessKey}
           aws_session_token = ${credentials.SessionToken}`);
}

function outputDocAsDownload(doc) {
  const credsPath = path.join(homedir, '.aws', 'credentials');
  fs.writeFileSync(credsPath, doc);
}

async function buildDocument(doc, credBlock) {
  return (await doc).concat('\n\n', await credBlock);
}

async function substituteAccountAlias(credBlock, config) {
  if (config.AccountAliases) {
    return config.AccountAliases
      .reduce((acc, alias) => {
        const re = new RegExp(`\\[${alias.AccountNumber}-(.*)\\]`);
        return acc.replace(re, `[${alias.Alias}-$1]`);
      }, (await credBlock));
  }

  return credBlock;
}

async function assumeRole(logger, roleAttributeValue, SAMLAssertion) {
  const rePrincipal      = /arn:aws:iam:[^:]*:[0-9]+:saml-provider\/[^,]+/i;
  const reRole           = /arn:aws:iam:[^:]*:([0-9]+):role\/([^,]+)/i;
  const principalMatches = roleAttributeValue.match(rePrincipal);
  const roleMatches      = roleAttributeValue.match(reRole);

  const params = {
    PrincipalArn: principalMatches[0],
    RoleArn:      roleMatches[0],
    SAMLAssertion,
  };

  const STS = new AWS.STS({
    apiVersion:  '2014-10-01',
    httpOptions: {
                   proxy: process.env.https_proxy
                          || process.env.HTTPS_PROXY
                          || '',
                 },
  });

  const response = await STS.assumeRoleWithSAML(params).promise();

  const role = {
    accountNumber: roleMatches[1],
    roleName:      roleMatches[2],
    credentials:   response.Credentials,
  };

  logger.info(chalk.green(`Assumed role: ${role.roleName}`));

  return role;
}

function onBeforeRequestEvent(details, config, logger) {
  const roleAttributeName  = 'https://aws.amazon.com/SAML/Attributes/Role';

  /* eslint no-underscore-dangle: ["error", { "allow": ["_postData"] }] */
  const samlResponseBase64 = unescape(parse(details._postData).SAMLResponse);

  new LibSaml(samlResponseBase64)
    .getAttribute(roleAttributeName)
    .map(role => assumeRole(logger, role, samlResponseBase64))
    .map(identity => createCredentialBlock(identity))
    .map(credBlock => substituteAccountAlias(credBlock, config))
    .reduce((doc, credBlock) => buildDocument(doc, credBlock), '')
    .then(doc => outputDocAsDownload(doc))
    .catch((err) => { throw (err); });
}


async function locateConfig(appName, argv) {
  const localAppData = process.env.LocalAppData
                       || path.join(
                                     process.env.HOME,
                                     'AppData',
                                     'Local',
                                   );

  const xdgConfigHome = process.env.XDG_CONFIG_HOME
                        || path.join(
                                      process.env.HOME,
                                      '.config',
                                    );

  const preferencesPath = path.join(
                                     process.env.HOME,
                                     'Library',
                                     'Application Support',
                                   );

  return argv.config || locatePath([
    path.join(localAppData, appName, 'config.yaml'),
    path.join(xdgConfigHome, appName, 'config.yaml'),
    path.join(preferencesPath, appName, 'config.yaml'),
    path.join(process.env.HOME, `.${appName}.yaml`),
  ]);
}


async function locateDataPath(appName) {
  const localAppData = process.env.LocalAppData
                       || path.join(
                                     process.env.HOME,
                                     'AppData',
                                     'Local',
                                   );

  const xdgDataHome = process.env.XDG_DATA_HOME
                      || path.join(
                                    process.env.HOME,
                                    '.local',
                                    'share',
                                  );

  const appSupportPath = path.join(
                                    process.env.HOME,
                                    'Library',
                                    'Application Support',
                                  );

  const dataHome = await locatePath([
                                     localAppData,
                                     xdgDataHome,
                                     appSupportPath,
                                     process.env.HOME,
                                   ]);

  return path.join(
                    dataHome,
                    (dataHome === process.env.HOME
                      ? `.${appName}`
                      : appName),
                  );
}

// ****************
// Main Entry Point
// ****************
(async () => {
  const appName = 'samlogin';
  const argv    = parseArgs(
                             process.argv.slice(2),
                             {
                               config: 'string',
                             },
                           );

  const logger = winston.createLogger({
    level:       'info',
    format:      winston.format.simple(),
    exitOnError: true,
    transports:  [
                   new winston.transports.Console(),
                 ],
  });

  const fmtConfigNotFound = 'No configuration file could be found.';

  const configPath = await locateConfig(appName, argv)
                     || (logger.error(fmtConfigNotFound) && process.exit());

  const config = yaml.safeLoad(fs.readFileSync(
    configPath,
    'utf8',
  ));
  const authUrl = config.AuthUrl;
  const samlUrl = config.samlUrl || 'https://signin.aws.amazon.com/saml';

  const browser = await puppeteer.launch({
    headless:    false,
    userDataDir: path.join(
                            await locateDataPath(appName),
                            'Chrome',
                          ),
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (interceptedRequest) => {
    interceptedRequest.continue();

    if (interceptedRequest.url() === samlUrl) {
      onBeforeRequestEvent(interceptedRequest, config, logger);
    }
  });

  await page.goto(new URL(authUrl).href, { timeout: 0 });
  await page.waitForRequest(samlUrl, { timeout: 0 });
  browser.close();
})();
