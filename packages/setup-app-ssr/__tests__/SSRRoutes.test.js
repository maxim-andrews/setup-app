'use strict';

const SSRRoutes = require('../lib/SSRRoutes');

describe('SSRRoutes', () => {
  test('should reject non-array', () => {

    const wrapperFunc = () => {
      SSRRoutes();
    };

    expect(wrapperFunc).toThrow('SSRRoutes first argument should be array');
  });

  test('should reject empty array', () => {

    const wrapperFunc = () => {
      SSRRoutes([]);
    };

    expect(wrapperFunc).toThrow('SSRRoutes first argument should be array');
  });
});
