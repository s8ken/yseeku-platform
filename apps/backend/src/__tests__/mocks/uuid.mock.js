// Mock for uuid to resolve ES module import issues
module.exports = {
  v1: jest.fn(() => 'mock-uuid-v1'),
  v3: jest.fn(() => 'mock-uuid-v3'),
  v4: jest.fn(() => 'mock-uuid-v4'),
  v5: jest.fn(() => 'mock-uuid-v5'),
  NIL: '00000000-0000-0000-0000-000000000000',
  parse: jest.fn(),
  stringify: jest.fn(),
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
};