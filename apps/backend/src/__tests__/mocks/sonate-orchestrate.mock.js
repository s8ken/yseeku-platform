// Mock for @sonate/orchestrate — satisfies ts-jest module resolution in CI
// where the package dist has not been built yet.
class DIDResolverService {
  async resolve() { return null; }
  async create() { return null; }
}

function getDIDResolver() { return new DIDResolverService(); }

module.exports = {
  DIDResolverService,
  getDIDResolver,
};
