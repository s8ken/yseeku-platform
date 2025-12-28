// Mock for @noble/ed25519 to resolve ES module import issues
module.exports = {
  CURVE: {},
  etc: {},
  ExtendedPoint: {},
  getPublicKey: jest.fn(),
  getPublicKeyAsync: jest.fn(),
  Point: {},
  sign: jest.fn(),
  signAsync: jest.fn(),
  utils: {},
  verify: jest.fn(),
  verifyAsync: jest.fn(),
};