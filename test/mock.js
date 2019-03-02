const samlAssertion = '';
const credentials = {
                      accessKeyId:  '',
                      secretKey:    '',
                      SessionToken: '',
                    };

const accountNumber = {
                        lab:  '012345678910',
                        sbx:  '123456789101',
                        dev:  '234567891012',
                        prod: '345678910123',
                      };

const roleAttributeValue = {
                             lab:  `arn:aws:iam::${accountNumber.lab}:role/MockRole,arn:aws:iam::${accountNumber.lab}:saml-provider/providername`,
                             sbx:  `arn:aws:iam::${accountNumber.sbx}:role/MockRole,arn:aws:iam::${accountNumber.sbx}:saml-provider/providername`,
                             prod: `arn:aws:iam::${accountNumber.prod}:role/MockRole,arn:aws:iam::${accountNumber.prod}:saml-provider/providername`,
                           };


const logLevel = {
                   error:   0,
                   warn:    1,
                   info:    2,
                   verbose: 3,
                   debug:   4,
                 };

// Mock Logger
const Logger = function mocklogger(log, level) {
                      this.log   = log;
                      this.level = logLevel[level];
                    };

Logger.prototype.error = function logerror(message) {
  if (this.level >= logLevel.error) {
       this.log.push({ level: 'error', message });
     }
};

Logger.prototype.warn = function logwarn(message) {
  if (this.level >= logLevel.warn) {
       this.log.push({ level: 'warn', message });
     }
};

Logger.prototype.info = function loginfo(message) {
  if (this.level >= logLevel.info) {
       this.log.push({ level: 'info', message });
     }
};

Logger.prototype.verbose = function logverbose(message) {
  if (this.level >= logLevel.verboxe) {
       this.log.push({ level: 'verbose', message });
     }
};

Logger.prototype.debug = function logdebug(message) {
  if (this.level >= logLevel.debug) {
       this.log.push({ level: 'debug', message });
     }
};

// Mock log
const Log = function mocklog() {
  this.log = [];
};

Log.prototype.push = function pushentry(entry) {
                            this.log.push(entry);
                          };

Log.prototype.entries = function logentries(level) {
                               return this.log.filter(x => x.level === level);
                             };


const Sts = function mocksts(success) {
  /* eslint-disable no-unused-vars */
  this.assumeRoleWithSAML = params => (
                                        success
                                        ? {
                                          promise: async () => ({
                                             Credentials: credentials,
                                          }),
                                        } : {
                                          promise: async () => {
                                             throw new Error('Fail!');
                                          },
                                        }
                                      );
};


function LibSaml() {
  return {
           getAttribute: function getAttribute() { return [{}]; },
         };
}

function qs() { return { SAMLResponse: '' }; }

const AWS = {
              STS: function STS() {},
            };

const libSts = {
                 assumeRole: async () => ({}),
               };

const libStsNull = {
                     assumeRole: async () => ({}),
                   };

const docBuilder = {
                     buildDocument:          async () => '',
                     createCredentialBlock:  async () => '',
                     substituteAccountAlias: async () => '',
                   };

const docWriter = {
                    outputDocAsDownload: async x => x,
                  };


module.exports = {
                   qs,
                   AWS,
                   libSts,        // Returns an object
                   libStsNull,    // Always returns null
                   docBuilder,
                   docWriter,
                   accountNumber,
                   samlAssertion,
                   credentials,
                   Log,
                   Logger,
                   LibSaml,
                   roleAttributeValue,
                   Sts,
                 };
