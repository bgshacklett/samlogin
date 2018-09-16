/* global describe it */

const expect = require('unexpected');
const flogin = require('../flogin.js');


describe('#extractPrincipal()', () => {
  it('Returns the Expected Value', () => {
    const roleAttribute = 'arn:aws:iam::000000000000:role/Federated_Administrator,arn:aws:iam::000000000000:saml-provider/Provider';
    const principalArn  = 'arn:aws:iam::000000000000:saml-provider/Provider';
    const roleArn       = 'arn:aws:iam::000000000000:role/Federated_Administrator';

    expect(flogin.extractPrincipal(roleAttribute).RoleArn, 'to be', roleArn);
    expect(flogin.extractPrincipal(roleAttribute).PrincipalArn, 'to be', principalArn);
  });
});
