const { stripIndents } = require('common-tags');

async function createCredentialBlock(identity) {
  const { accountNumber, roleName, credentials } = await identity;

  return (stripIndents`[${accountNumber}-${roleName}]
           aws_access_key_id = ${credentials.AccessKeyId}
           aws_secret_access_key = ${credentials.SecretAccessKey}
           aws_session_token = ${credentials.SessionToken}`);
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


module.exports = {
                   createCredentialBlock,
                   buildDocument,
                   substituteAccountAlias,
                 };
