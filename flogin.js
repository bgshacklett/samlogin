// ************
// Requirements
// ************
const AWS       = require('aws-sdk');
const fs        = require('fs');
const jsdom     = require('jsdom');
const homedir   = require('os').homedir();
const path      = require('path');
const puppeteer = require('puppeteer');
const yaml      = require('js-yaml');
const { URL }   = require('url');
const { parse } = require('querystring');


// ****************
// Global constants
// ****************
const appName = 'HelloHeadless';


// *********
// Functions
// *********
function outputDocAsDownload(doc) {
  fs.writeFileSync(path.join(homedir, '.aws', 'credentials'), doc, (err) => {
    if (err) { throw err; }
  });
}


function extractPrincipalPlusRoleAndAssumeRole(
  samlattribute,
  SAMLAssertion,
) {
  const rePrincipal = /arn:aws:iam:[^:]*:[0-9]+:saml-provider\/[^,]+/i;
  const reRole      = /arn:aws:iam:[^:]*:[0-9]+:role\/[^,]+/i;
  const PrincipalArn = samlattribute.match(rePrincipal)[0];
  const RoleArn      = samlattribute.match(reRole)[0];

  const assumeRoleParams = {
    PrincipalArn,
    RoleArn,
    SAMLAssertion,
  };

  const STS = new AWS.STS();
  STS.assumeRoleWithSAML(assumeRoleParams, (err, data) => {
    if (err) throw err;
    else {
      const { AccessKeyId, SecretAccessKey, SessionToken } = data.Credentials;
      outputDocAsDownload(`[default]
                           aws_access_key_id = ${AccessKeyId}
                           aws_secret_access_key = ${SecretAccessKey}
                           aws_session_token = ${SessionToken}`);
    }
  });
}


function onBeforeRequestEvent(details) {
  const { JSDOM }        = jsdom;
  const awsSamlNamespace = 'https://aws.amazon.com/SAML';
  const roleSelector     = `[Name="${awsSamlNamespace}/Attributes/Role"]`;

  /* eslint no-underscore-dangle: ["error", { "allow": ["_postData"] }] */
  const postData           = parse(details._postData);

  const samlResponseBase64 = unescape(postData.SAMLResponse);

  const samlResponse = Buffer.from(samlResponseBase64, 'base64')
                             .toString();

  const samlDoc = new JSDOM(
                             samlResponse,
                             { contentType: 'text/xml' },
                           )
                           .window
                           .document;

  const roleClaims = samlDoc.querySelectorAll(roleSelector);

  roleClaims.forEach((element) => {
    extractPrincipalPlusRoleAndAssumeRole(
      element.textContent,
      samlResponseBase64,
    );
  });
}


// ****************
// Main Entry Point
// ****************
(async () => {
  const config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

  const authUrl = config.AuthUrl;
  const samlUrl = 'https://signin.aws.amazon.com/saml';

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: path.join(process.env.LOCALAPPDATA, appName, 'Chrome'),
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (interceptedRequest) => {
    if (interceptedRequest.url() === samlUrl) {
      onBeforeRequestEvent(interceptedRequest);
    }

    interceptedRequest.continue();
  });

  await page.goto(new URL(authUrl).href);

  await browser.close();
})();
