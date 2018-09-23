# flogin (short for federated login)
This tool uses Puppeteer (https://github.com/GoogleChrome/puppeteer) to
intercept SAML logins to AWS and store the credentials in a credentials file.

`flogin` was inspired heavily by the SAML to STS Keys extension
(https://github.com/prolane/samltoawsstskeys) by G.T.C. (Gerard) Laan.

## Installation
1. Install Node.js (tested on v8.11.4).
2. Clone the project repository to your preferred location.
3. Navigate to the project directory.
4. Install the package dependencies with `yarn install` or `npm install`.
5. Create your configuration file in the project directory.

## Configuration
Configuration is managed with a yaml file named config.yaml in the project
directory. An example configuration may be found at example_config.yaml.

### Configuration Keys
* `AuthUrl` - The URL of your Identity Provider which accepts your credentials
* `AccountAliases` - A sequence of maps from account number to alias

## Usage
`node /path/to/flogin/flogin.js`

Calling the command will launch an embedded instance of Chromium and navigate
to `AuthUrl`. Once you log in, your IDP will forward the browser to the AWS
SAML endpoint and the credentials will be intercepted and written to
`~/.aws/credentials`.

Until the tool is packaged in a more convenient form, it may be useful to use
reverse-i-search (`^R`) to execute subsequent invocations.
