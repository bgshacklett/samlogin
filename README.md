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
Configuration is managed with a yaml file. flogin will attempt to find the
configuration file in the following paths (in order):
  1. An exact path specified by the `--config` parameter
  2. `%LOCALAPPDATA\flogin\config.yaml`
  3. `$XDG_CONFIG_HOME/flogin/config.yaml`
  4. `$HOME/Library/Preferences/flogin/config.yaml`
  5. `~/.flogin.yaml`

### Configuration Keys
* `AuthUrl` - The URL of your Identity Provider which accepts your credentials
* `AccountAliases` - A sequence of maps from account number to alias

An example configuration:
```
---
# Example Configuration File

AuthUrl:  # The login URL of your IDP - E.g.:
          # https://accounts.google.com/o/saml2/init.sso?...

# Use "Prod" in place of 123456789012 and Dev in place of 210987654321in the
# profile name.
AccountAliases:
  - AccountNumber: '123456789012'
    Alias: Prod
  - AccountNumber: '210987654321'
    Alias: Dev
```

## Usage
`flogin [--config <path>]`

Calling the command will launch an embedded instance of Chromium and navigate
to `AuthUrl`. Once you log in, your IDP will forward the browser to the AWS
SAML endpoint and the credentials will be intercepted and written to
`~/.aws/credentials`.
