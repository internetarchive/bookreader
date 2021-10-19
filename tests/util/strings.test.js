import { APPLY_FILTERS, applyVariables } from '@/src/util/strings.js';

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

  test('Nullish values', () => {
    expect(applyVariables('Hello {{name}}', {name: undefined})).toEqual('Hello undefined');
    expect(applyVariables('Hello {{name}}', {name: null})).toEqual('Hello null');
    expect(applyVariables('Hello {{name}}', {name: ''})).toEqual('Hello ');
  });

  test('Non-string values', () => {
    expect(applyVariables('Hello {{name}}', {name: 10})).toEqual('Hello 10');
    expect(applyVariables('Hello {{name}}', {name: 0})).toEqual('Hello 0');
  });

  test('Filters', () => {
    expect(applyVariables('Hello {{name|urlencode}}', {name: 'Jim bob'})).toEqual('Hello Jim%20bob');
    expect(applyVariables('Hello {{name|urlencode}}', {name: 0})).toEqual('Hello 0');
    expect(applyVariables('Hello {{name|urlencode}}', {})).toEqual('Hello {{name|urlencode}}');
  });

  test('Custom filters', () => {
    expect(applyVariables('Hello {{name|upper}}', {name: 'Jim bob'}, {}, {upper: s => s.toUpperCase()})).toEqual('Hello JIM BOB');
  });

  test('Multiple filters', () => {
    const filters = Object.assign({}, APPLY_FILTERS, {
      upper: s => s.toUpperCase(),
      lower: s => s.toLowerCase(),
      double: s => s + s,
    });
    expect(applyVariables('Hello {{name|upper|urlencode}}', {name: 'Jim bob'}, {}, filters)).toEqual('Hello JIM%20BOB');
    expect(applyVariables('Hello {{name|upper|lower}}', {name: 'Jim bob'}, {}, filters)).toEqual('Hello jim bob');
    expect(applyVariables('Hello {{name|lower|upper}}', {name: 'Jim bob'}, {}, filters)).toEqual('Hello JIM BOB');
    expect(applyVariables('Hello {{name|lower|double}}', {name: 'Jim bob'}, {}, filters)).toEqual('Hello jim bobjim bob');
  });
});
