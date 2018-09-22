// ************
const AWS       = require('aws-sdk');
const fs        = require('fs');
const homedir   = require('os').homedir();
const path      = require('path');
const puppeteer = require('puppeteer');
const yaml      = require('js-yaml');
const { URL }   = require('url');
const { parse } = require('querystring');
const LibSaml   = require('libsaml');


// **************************
// Global configuration items
// **************************
const appName = 'flogin';
const proxy   = process.env.https_proxy || process.env.HTTPS_PROXY || '';


// *********
// Functions
// *********
async function createCredentialBlock(identity) {
  const { accountNumber, roleName, credentials } = await identity;

  return (`[${accountNumber}-${roleName}]
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

async function assumeRole(roleAttributeValue, SAMLAssertion) {
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
    apiVersion:   '2014-10-01',
    httpsOptions: { proxy },
  });

  const response = await STS.assumeRoleWithSAML(params).promise();

  return {
    accountNumber: roleMatches[1],
    roleName:      roleMatches[2],
    credentials:   response.Credentials,
  };
}

function onBeforeRequestEvent(details) {
  const roleAttributeName  = 'https://aws.amazon.com/SAML/Attributes/Role';

  /* eslint no-underscore-dangle: ["error", { "allow": ["_postData"] }] */
  const samlResponseBase64 = unescape(parse(details._postData).SAMLResponse);

  new LibSaml(samlResponseBase64)
    .getAttribute(roleAttributeName)
    .map(role => assumeRole(role, samlResponseBase64))
    .map(identity => createCredentialBlock(identity))
    .reduce((doc, credBlock) => buildDocument(doc, credBlock), '')
    .then(doc => outputDocAsDownload(doc))
    .catch((err) => { throw (err); });
}


// ****************
// Main Entry Point
// ****************
(async () => {
  const config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

  const authUrl = config.AuthUrl;
  const samlUrl = 'https://signin.aws.amazon.com/saml';

  const browser = await puppeteer.launch({
    headless:    false,
    userDataDir: path.join(process.env.LOCALAPPDATA, appName, 'Chrome'),
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (interceptedRequest) => {
    interceptedRequest.continue();

    if (interceptedRequest.url() === samlUrl) {
      onBeforeRequestEvent(interceptedRequest);
    }
  });

  await page.goto(new URL(authUrl).href, { timeout: 0 });
  await page.waitForRequest(samlUrl, { timeout: 0 });
  browser.close();
})();
