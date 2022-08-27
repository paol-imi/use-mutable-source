import { shallowEqual } from '../src';

describe('how shallowEqual works', () => {
  it('should correctly establish shallow equality', () => {
    expect(shallowEqual(null, null)).toBeTruthy();

    expect(shallowEqual({ foo: 'bar' }, null)).toBeFalsy();
    expect(shallowEqual({ foo: 'bar' }, { foo: 'bar' })).toBeTruthy();
    expect(shallowEqual({ foo: 'bar' }, { bar: 'foo' })).toBeFalsy();
    expect(shallowEqual({ foo: 'bar' }, {})).toBeFalsy();
    expect(shallowEqual({}, {})).toBeTruthy();

    expect(shallowEqual(['bar'], null)).toBeFalsy();
    expect(shallowEqual(['bar'], ['bar'])).toBeTruthy();
    expect(shallowEqual(['bar'], ['foo'])).toBeFalsy();
    expect(shallowEqual(['bar'], [])).toBeFalsy();
    expect(shallowEqual([], [])).toBeTruthy();
  });
});
