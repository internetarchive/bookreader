/**
 *  General setup for Jest tests
 */

/**
 * Mock InterceptionObserver - not in Jest's JSDOM
 */
const mockInterceptionObserver = function() {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(),
    unobserve: jest.fn()
  };
};
window.IntersectionObserver = mockInterceptionObserver;
