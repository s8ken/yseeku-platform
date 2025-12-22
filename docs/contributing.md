# Contributing Guidelines

## Overview

Thank you for your interest in contributing to the SONATE platform! This guide will help you understand our development process, coding standards, and how to make valuable contributions to our symbiotic AI orchestration system.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Process](#development-process)
- [Getting Started](#getting-started)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community Guidelines](#community-guidelines)

## Code of Conduct

### Our Pledge

We are committed to making participation in our community a harassment-free experience for everyone, regardless of:

- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socioeconomic status, nationality
- Personal appearance, race, religion, or sexual identity

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, public or private
- Explicit threats or violent language
- Sexually explicit language or imagery
- Trolling, insulting, or derogatory comments
- Publishing others' private information without permission

### Reporting

If you witness or experience unacceptable behavior, please contact us at conduct@sonate.ai.

## Development Process

### Branch Strategy

We use a Git Flow-inspired branching strategy:

```
main                 # Production-ready code
├── develop          # Integration branch for features
├── feature/*        # Feature development branches
├── release/*        # Release preparation branches
├── hotfix/*         # Critical fixes
└── docs/*           # Documentation updates
```

### Workflow Overview

1. **Fork** the repository
2. **Create** a feature branch from `develop`
3. **Develop** and test your changes
4. **Submit** a pull request to `develop`
5. **Review** and address feedback
6. **Merge** after approval
7. **Deploy** through our release process

### Conventional Commits

We use conventional commits for automated changelog generation:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```
feat(core): add Phase-Shift Velocity calculation module

fix(detect): resolve memory leak in real-time monitoring

docs(api): update authentication documentation

test(lab): add unit tests for experiment runner
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Git 2.30+
- Docker 20.0+ (optional)
- VS Code or compatible IDE

### Local Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/yseeku-platform.git
cd yseeku-platform

# 2. Add upstream remote
git remote add upstream https://github.com/s8ken/yseeku-platform.git

# 3. Install dependencies
npm install

# 4. Set up development environment
npm run dev:setup

# 5. Start development server
npm run dev
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint             # Run linter
npm run format           # Format code

# Package-specific
npm run dev:core         # Develop core package
npm run dev:detect       # Develop detect package
npm run dev:lab          # Develop lab package
npm run dev:orchestrate  # Develop orchestrate package

# Testing
npm run test:watch       # Watch mode testing
npm run test:coverage    # Generate coverage report
npm run test:e2e         # End-to-end tests
```

## Coding Standards

### TypeScript Guidelines

We use TypeScript for type safety and better developer experience:

```typescript
// Use explicit return types
function calculatePhaseVelocity(
  previousState: AgentState,
  currentState: AgentState
): PhaseVelocity {
  // Implementation
}

// Use interfaces for data structures
interface AgentState {
  reasoning: number;
  coherence: number;
  timestamp: number;
}

// Use enums for constants
enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Use generics for reusable components
class Repository<T> {
  private items: T[] = [];
  
  add(item: T): void {
    this.items.push(item);
  }
  
  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }
}
```

### Code Style

We follow these style guidelines:

```typescript
// 1. Use camelCase for variables and functions
const phaseVelocity = calculateVelocity(agent);
const isWithinThreshold = checkThreshold(velocity);

// 2. Use PascalCase for classes and interfaces
class AgentRegistry {
  // ...
}

interface TrustReceipt {
  // ...
}

// 3. Use UPPER_SNAKE_CASE for constants
const MAX_VELOCITY_THRESHOLD = 0.001;
const DEFAULT_TIMEOUT = 5000;

// 4. Use descriptive names
function calculateConstitutionalCoherenceScore(agent: Agent): number {
  // Good: descriptive and clear
}

function calcScore(a: Agent): number {
  // Bad: too abbreviated
}

// 5. Add JSDoc comments for public APIs
/**
 * Calculates Phase-Shift Velocity for an agent
 * @param previousState Previous agent state
 * @param currentState Current agent state
 * @returns Phase-Shift Velocity value
 */
export function calculatePhaseVelocity(
  previousState: AgentState,
  currentState: AgentState
): PhaseVelocity {
  // Implementation
}
```

### File Organization

```
src/
├── components/          # Reusable UI components
├── services/           # Business logic services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── hooks/              # React hooks (if applicable)
└── __tests__/          # Test files
```

### Error Handling

```typescript
// Use custom error classes
class PhaseVelocityError extends Error {
  constructor(
    message: string,
    public readonly velocity: number,
    public readonly threshold: number
  ) {
    super(message);
    this.name = 'PhaseVelocityError';
  }
}

// Use Result pattern for operations that can fail
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

function safeCalculateVelocity(
  previousState: AgentState,
  currentState: AgentState
): Result<PhaseVelocity> {
  try {
    const velocity = calculatePhaseVelocity(previousState, currentState);
    return { success: true, data: velocity };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Testing Guidelines

### Test Structure

We use Jest for unit testing and Playwright for E2E testing:

```typescript
// Unit test example
describe('PhaseVelocityCalculator', () => {
  let calculator: PhaseVelocityCalculator;

  beforeEach(() => {
    calculator = new PhaseVelocityCalculator();
  });

  describe('calculate', () => {
    it('should calculate correct velocity for valid inputs', () => {
      // Arrange
      const previousState: AgentState = {
        reasoning: 0.5,
        coherence: 0.8,
        timestamp: 1000
      };
      
      const currentState: AgentState = {
        reasoning: 0.6,
        coherence: 0.85,
        timestamp: 2000
      };

      // Act
      const result = calculator.calculate(previousState, currentState);

      // Assert
      expect(result.value).toBeCloseTo(0.000058, 6);
      expect(result.reasoning).toBe(0.1);
      expect(result.coherence).toBe(0.05);
    });

    it('should throw error for invalid time interval', () => {
      // Arrange
      const invalidState = {
        reasoning: 0.5,
        coherence: 0.8,
        timestamp: 1000
      };

      // Act & Assert
      expect(() => {
        calculator.calculate(invalidState, invalidState);
      }).toThrow(InvalidTimeIntervalError);
    });
  });
});
```

### Testing Best Practices

1. **Arrange-Act-Assert** pattern
2. **Descriptive test names**
3. **Test edge cases**
4. **Mock external dependencies**
5. **Maintain test independence**

```typescript
// Integration test example
describe('Agent Registry Integration', () => {
  let registry: AgentRegistry;
  let mockDatabase: MockDatabase;

  beforeEach(async () => {
    mockDatabase = new MockDatabase();
    registry = new AgentRegistry(mockDatabase);
    await mockDatabase.clear();
  });

  it('should register agent and persist to database', async () => {
    // Arrange
    const agent: Agent = {
      id: 'agent-123',
      name: 'Test Agent',
      type: 'research',
      capabilities: ['analysis'],
      constitutionalScore: 0.9,
      phaseVelocity: 0.001
    };

    // Act
    const result = await registry.register(agent);

    // Assert
    expect(result.success).toBe(true);
    expect(mockDatabase.getAgent(agent.id)).toEqual(agent);
  });
});
```

### Coverage Requirements

- **Unit Tests**: Minimum 80% line coverage
- **Integration Tests**: Cover critical workflows
- **E2E Tests**: Cover user journeys

```bash
# Run coverage report
npm run test:coverage

# Check coverage thresholds
npm run test:coverage:check
```

## Documentation Standards

### Code Documentation

```typescript
/**
 * Manages Phase-Shift Velocity monitoring and alerts
 * 
 * @example
 * ```typescript
 * const monitor = new PhaseVelocityMonitor({
 *   threshold: 0.001,
 *   alertHandler: (alert) => console.log(alert)
 * });
 * 
 * await monitor.start();
 * ```
 */
export class PhaseVelocityMonitor {
  /**
   * Creates a new Phase-Shift Velocity monitor
   * @param options Configuration options
   * @param options.threshold Velocity threshold for alerts
   * @param options.alertHandler Function to handle alerts
   * @param options.pollingInterval Monitoring interval in milliseconds
   */
  constructor(options: PhaseVelocityMonitorOptions) {
    // Implementation
  }

  /**
   * Starts monitoring agent velocities
   * @returns Promise that resolves when monitoring starts
   * @throws {Error} If monitoring is already active
   */
  async start(): Promise<void> {
    // Implementation
  }
}
```

### API Documentation

```typescript
/**
 * @api {post} /agents Register a new agent
 * @apiName RegisterAgent
 * @apiGroup Agents
 * @apiVersion 1.0.0
 * 
 * @apiParam {Object} agent Agent registration data
 * @apiParam {string} agent.name Human-readable name
 * @apiParam {string} agent.type Agent type
 * @apiParam {string[]} agent.capabilities List of capabilities
 * 
 * @apiParamExample {json} Request Example:
 * {
 *   "name": "Medical Assistant",
 *   "type": "healthcare",
 *   "capabilities": ["diagnosis", "treatment_planning"]
 * }
 * 
 * @apiSuccess {Object} data Registered agent data
 * @apiSuccess {string} data.id Unique agent identifier
 * @apiSuccess {string} data.did Decentralized identifier
 * 
 * @apiSuccessExample {json} Success Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "agent-123",
 *     "did": "did:method:123456789abcdefghi",
 *     "name": "Medical Assistant",
 *     "type": "healthcare",
 *     "status": "active"
 *   }
 * }
 * 
 * @apiError {Object} error Error information
 * @apiError {string} error.code Error code
 * @apiError {string} error.message Error description
 */
```

## Pull Request Process

### Pull Request Template

```markdown
## Description
Brief description of the changes made in this pull request.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of the code completed
- [ ] Code is commented appropriately
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] No ESLint warnings

## Related Issues
Closes #123
Fixes #456
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer review required
3. **Security Review**: For changes affecting security or authentication
4. **Performance Review**: For changes affecting performance
5. **Approval**: Merge after all approvals received

### Review Guidelines

**For Reviewers:**
- Check for code quality and adherence to standards
- Verify test coverage and test quality
- Assess performance implications
- Review documentation updates
- Provide constructive feedback

**For Authors:**
- Address all review comments
- Update tests as needed
- Ensure CI/CD passes
- Respond to questions promptly

## Release Process

### Version Management

We use semantic versioning (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

```bash
# 1. Update version numbers
npm version patch  # or minor/major

# 2. Update changelog
npm run changelog

# 3. Run full test suite
npm run test:full

# 4. Build packages
npm run build:prod

# 5. Create release tag
git tag v1.2.3

# 6. Push to repository
git push origin main --tags

# 7. Publish packages (if applicable)
npm run publish
```

### Changelog Format

```markdown
# [1.2.3] - 2024-01-15

## Added
- Phase-Shift Velocity monitoring dashboard
- Support for custom constitutional principles
- Agent performance benchmarking

## Changed
- Improved real-time detection accuracy
- Updated API authentication mechanism
- Enhanced error handling in orchestration module

## Fixed
- Memory leak in long-running experiments
- TypeScript compilation issues
- Documentation typos

## Security
- Updated cryptographic dependencies
- Fixed potential XSS vulnerability
- Enhanced input validation

## Deprecated
- Legacy agent API endpoints (will be removed in v2.0)

## Removed
- Support for Node.js 16.x
- Deprecated configuration options
```

## Community Guidelines

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord Chat**: Real-time community interaction
- **Email**: Private questions and support

### Issue Reporting

When reporting issues, please include:

1. **Clear title** describing the problem
2. **Detailed description** of the issue
3. **Steps to reproduce** the problem
4. **Expected behavior** vs. **actual behavior**
5. **Environment information** (OS, Node.js version, etc.)
6. **Code examples** or **screenshots** if applicable

### Feature Requests

For feature requests:

1. **Check existing issues** first
2. **Use the feature request template**
3. **Describe the use case** clearly
4. **Explain the benefit** to the community
5. **Consider implementation complexity**

### Code of Conduct Enforcement

We enforce our Code of Conduct through:

- **Warning**: For minor violations
- **Temporary ban**: For repeated violations
- **Permanent ban**: For severe violations

All enforcement decisions are made by the maintainers team.

## Recognition

### Contributor Recognition

We recognize contributors through:

- **Contributor list** in documentation
- **Release notes** mentions
- **Community spotlight** features
- **Contributor badges** on GitHub

### Becoming a Maintainer

Active contributors may be invited to become maintainers based on:

- **Consistent quality contributions**
- **Community engagement**
- **Technical expertise**
- **Alignment with project goals**

## Resources

### Development Resources

- [API Documentation](./api/overview.md)
- [Architecture Guide](./architecture.md)
- [Phase-Shift Velocity Guide](./phase-shift-velocity.md)
- [Demo Documentation](./demo-documentation.md)

### Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

### Tools and Extensions

**VS Code Extensions:**
- TypeScript Importer
- ESLint
- Prettier
- Jest Runner
- GitLens

**Browser Extensions:**
- React Developer Tools
- Redux DevTools
- JSON Viewer

---

Thank you for contributing to the SONATE platform! Your contributions help us advance symbiotic AI orchestration and create a safer, more aligned future for artificial intelligence.

If you have any questions about contributing, please don't hesitate to reach out through our community channels.