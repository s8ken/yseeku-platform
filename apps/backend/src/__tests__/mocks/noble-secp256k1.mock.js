// Mock for @noble/secp256k1 to resolve ES module import issues
module.exports = {
  CURVE: {},
  etc: {},
  getPublicKey: jest.fn(),
  getSharedSecret: jest.fn(),
  Point: {},
  ProjectivePoint: {},
  sign: jest.fn(),
  signAsync: jest.fn(),
  Signature: {},
  utils: {},
  verify: jest.fn(),
};