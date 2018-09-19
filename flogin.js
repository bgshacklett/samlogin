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


function extractPrincipal(roleAttribute) {
  const rePrincipal = /arn:aws:iam:[^:]*:[0-9]+:saml-provider\/[^,]+/i;
  const reRole      = /arn:aws:iam:[^:]*:[0-9]+:role\/[^,]+/i;
  const PrincipalArn = roleAttribute.match(rePrincipal)[0];
  const RoleArn      = roleAttribute.match(reRole)[0];

  return {
    PrincipalArn,
    RoleArn,
  };
}


function assumeRole(
  samlattribute,
  SAMLAssertion,
) {
  const { PrincipalArn, RoleArn } = extractPrincipal(samlattribute);

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
  const roleAttributeName  = 'https://aws.amazon.com/SAML/Attributes/Role';

  /* eslint no-underscore-dangle: ["error", { "allow": ["_postData"] }] */
  const samlResponseBase64 = unescape(parse(details._postData).SAMLResponse);

  new LibSaml(samlResponseBase64)
    .getAttribute(roleAttributeName)
    .forEach(element => assumeRole(element, samlResponseBase64));
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

  await page.goto(new URL(authUrl).href);
})();

if (typeof module !== 'undefined' && module.exports != null) {
  exports.extractPrincipal = extractPrincipal;
}
