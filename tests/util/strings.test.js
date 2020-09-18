import { applyVariables } from '../../src/util/strings.js';

describe('applyVariables', () => {
  test('null cases', () => {
    expect(applyVariables(null, {})).toBeUndefined();
    expect(applyVariables('', {})).toEqual('');
    expect(applyVariables('', {x: 3})).toEqual('');
  });

  test('Ignores undefined variables', () => {
    expect(applyVariables('Hello {{name}}!', {})).toEqual('Hello {{name}}!');
  });

  test('Replaces multiple instances', () => {
    expect(applyVariables('Hello {{name}}! How are you doing, {{name}}?', {name: 'Bill'})).toEqual('Hello Bill! How are you doing, Bill?');
    expect(applyVariables('Hello {{name}}! You are {{age}}, {{name}}', {name: 'Bill', age: 54})).toEqual('Hello Bill! You are 54, Bill');
  });

  test('Is case sensitive', () => {
    expect(applyVariables('Hello {{name}}', {NAME: 'Bill'})).toEqual('Hello {{name}}');
  });

  test('Supports variable names with funny chars', () => {
    expect(applyVariables('Hello {{first name}}', {'first name': 'Bill'})).toEqual('Hello Bill');
  });

  test('Overrides do override', () => {
    expect(applyVariables('Hello {{name}}', {name: 'Bill'}, {name: 'Bobby'})).toEqual('Hello Bobby');
  });
});
