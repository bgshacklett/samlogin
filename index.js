#!/usr/bin/env node

// ************
const AWS        = require('aws-sdk');
const fs         = require('fs');
const path       = require('path');
const puppeteer  = require('puppeteer');
const yaml       = require('js-yaml');
const { URL }    = require('url');
const { parse }  = require('querystring');
const LibSaml    = require('libsaml');
const locatePath = require('locate-path');
const parseArgs  = require('minimist');
const winston    = require('winston');

const libsts     = require('./sts.js');
const docBuilder = require('./docBuilder.js');
const docWriter  = require('./docWriter.js');


// *********
// Functions
// *********
function onBeforeRequestEvent(
                               qs,      // Parses the query string
                               request, // A request containing a SAML response
                               config,  // Contains config details
                               logger,  // Handles logging
                               client,  // The AWS SDK client
                               SamlLib, // Parses SAML Response(s)
                               stslib,  // Responsible for assuming roles
                               builder, // Builds the creds doc
                               writer,  // Writes the creds doc
                             ) {
  const roleAttributeName  = 'https://aws.amazon.com/SAML/Attributes/Role';

  /* eslint no-underscore-dangle: ["error", { "allow": ["_postData"] }] */
  const samlResponse = unescape(qs(request._postData).SAMLResponse);

  const STS = new client.STS({
                               apiVersion:  '2014-10-01',
                               httpOptions: {
                                              proxy: process.env.https_proxy
                                                     || process.env.HTTPS_PROXY
                                                     || '',
                                            },
                             });

  new SamlLib(samlResponse)
    .getAttribute(roleAttributeName)
    .map(role => stslib.assumeRole(config, logger, STS, role, samlResponse))
    .filter(x => x != null) // filter roles which could not be assumed.
    .map(identity => builder.createCredentialBlock(identity))
    .map(credBlock => builder.substituteAccountAlias(credBlock, config))
    .reduce((doc, credBlock) => builder.buildDocument(doc, credBlock), '')
    .then(doc => writer.outputDocAsDownload(doc))
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
async function Main() {
  const appName = 'samlogin';
  const argv    = parseArgs(
                             process.argv.slice(2),
                             {
                               config: 'string',
                               debug:  'boolean',
                             },
                           );

  const logger = winston.createLogger({
    level:       argv.debug ? 'debug' : 'info',
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
      onBeforeRequestEvent(
                            parse,
                            interceptedRequest,
                            config,
                            logger,
                            AWS,
                            LibSaml,
                            libsts,
                            docBuilder,
                            docWriter,
                          );
    }
  });

  await page.goto(new URL(authUrl).href, { timeout: 0 });
  await page.waitForRequest(samlUrl, { timeout: 0 });
  browser.close();
}


// Allow loading functions as a Node.js module for testing purposes
if (require.main === module) {
  (async () => Main())();
}

module.exports = {
                   onBeforeRequestEvent,
                 };
