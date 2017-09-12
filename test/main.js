const assert = require('chai').assert;

const awsIamPolicy = require('../');

let exportPolicy = awsIamPolicy.exportPolicy;
let exportRole = awsIamPolicy.exportRole;
let importPolicy = awsIamPolicy.importPolicy;
let importRole = awsIamPolicy.importRole;
let validatePolicy = awsIamPolicy.validatePolicy;
let validateRole = awsIamPolicy.validateRole;
let deletePolicy = awsIamPolicy.deletePolicy;

describe('require each module', () => {
  it('loads valid', () => {
    assert.isFunction(exportPolicy, 'exportPolicy is not loaded');
    assert.isFunction(exportRole, 'exportRole is not loaded');
    assert.isFunction(importPolicy, 'importPolicy is not loaded');
    assert.isFunction(importRole, 'importRole is not loaded');
    assert.isFunction(validatePolicy, 'validatePolicy is not loaded');
    assert.isFunction(validateRole, 'validateRole is not loaded');
    assert.isFunction(deletePolicy, 'deletePolicy is not loaded');
  });
});
