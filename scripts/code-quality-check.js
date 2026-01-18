#!/usr/bin/env node

/**
 * Code Quality Automation Script
 *
 * Runs comprehensive code quality checks across the monorepo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodeQualityChecker {
  constructor() {
    this.results = {
      lint: { passed: 0, failed: 0, errors: [] },
      format: { passed: 0, failed: 0, errors: [] },
      types: { passed: 0, failed: 0, errors: [] },
      security: { passed: 0, failed: 0, errors: [] },
      performance: { passed: 0, failed: 0, errors: [] },
      coverage: { passed: 0, failed: 0, errors: [] },
    };
  }

  /**
   * Run all code quality checks
   */
  async runAllChecks() {
    console.log('🔍 Starting Code Quality Checks...\n');

    try {
      await this.checkLinting();
      await this.checkFormatting();
      await this.checkTypeScript();
      await this.checkSecurity();
      await this.checkPerformance();
      await this.checkCoverage();

      this.generateReport();
    } catch (error) {
      console.error('❌ Code quality checks failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check ESLint compliance
   */
  async checkLinting() {
    console.log('📋 Checking ESLint compliance...');

    try {
      execSync('npx eslint packages/*/src/**/*.ts --max-warnings 0', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      this.results.lint.passed = 1;
      console.log('✅ ESLint checks passed\n');
    } catch (error) {
      this.results.lint.failed = 1;
      this.results.lint.errors = error.stdout
        ? error.stdout.toString().split('\n')
        : [error.message];
      console.log('❌ ESLint checks failed\n');
    }
  }

  /**
   * Check Prettier formatting
   */
  async checkFormatting() {
    console.log('🎨 Checking Prettier formatting...');

    try {
      const result = execSync('npx prettier --check packages/*/src/**/*.ts', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      this.results.format.passed = 1;
      console.log('✅ Prettier checks passed\n');
    } catch (error) {
      this.results.format.failed = 1;
      this.results.format.errors = error.stdout
        ? error.stdout.toString().split('\n')
        : [error.message];
      console.log('❌ Prettier checks failed\n');
    }
  }

  /**
   * Check TypeScript compilation
   */
  async checkTypeScript() {
    console.log('📘 Checking TypeScript compilation...');

    try {
      execSync('npm run build', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      this.results.types.passed = 1;
      console.log('✅ TypeScript checks passed\n');
    } catch (error) {
      this.results.types.failed = 1;
      this.results.types.errors = error.stdout
        ? error.stdout.toString().split('\n')
        : [error.message];
      console.log('❌ TypeScript checks failed\n');
    }
  }

  /**
   * Check security vulnerabilities
   */
  async checkSecurity() {
    console.log('🔒 Checking security vulnerabilities...');

    try {
      // Check for known vulnerabilities
      execSync('npm audit --audit-level moderate', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      this.results.security.passed = 1;
      console.log('✅ Security checks passed\n');
    } catch (error) {
      this.results.security.failed = 1;
      this.results.security.errors = error.stdout
        ? error.stdout.toString().split('\n')
        : [error.message];
      console.log('❌ Security checks failed\n');
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    console.log('⚡ Checking performance metrics...');

    try {
      // Run performance benchmarks
      execSync('npm run test:performance', {
        stdio: 'pipe',
        cwd: path.join(process.cwd(), 'packages/detect'),
      });

      this.results.performance.passed = 1;
      console.log('✅ Performance checks passed\n');
    } catch (error) {
      this.results.performance.failed = 1;
      this.results.performance.errors = error.stdout
        ? error.stdout.toString().split('\n')
        : [error.message];
      console.log('❌ Performance checks failed\n');
    }
  }

  /**
   * Check test coverage
   */
  async checkCoverage() {
    console.log('📊 Checking test coverage...');

    try {
      execSync('npm run test', {
        stdio: 'pipe',
        cwd: path.join(process.cwd(), 'packages/core'),
      });

      this.results.coverage.passed = 1;
      console.log('✅ Coverage checks passed\n');
    } catch (error) {
      this.results.coverage.failed = 1;
      this.results.coverage.errors = error.stdout
        ? error.stdout.toString().split('\n')
        : [error.message];
      console.log('❌ Coverage checks failed\n');
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📋 Code Quality Report');
    console.log('=====================\n');

    const categories = ['lint', 'format', 'types', 'security', 'performance', 'coverage'];
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach((category) => {
      const result = this.results[category];
      const status = result.passed ? '✅' : '❌';
      const name = category.charAt(0).toUpperCase() + category.slice(1);

      console.log(`${status} ${name}: ${result.passed ? 'PASSED' : 'FAILED'}`);

      if (result.failed && result.errors.length > 0) {
        console.log('   Errors:');
        result.errors.slice(0, 3).forEach((error) => {
          if (error.trim()) console.log(`   - ${error.trim()}`);
        });
        if (result.errors.length > 3) {
          console.log(`   ... and ${result.errors.length - 3} more errors`);
        }
      }

      totalPassed += result.passed;
      totalFailed += result.failed;
    });

    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Passed: ${totalPassed}/${categories.length}`);
    console.log(`❌ Failed: ${totalFailed}/${categories.length}`);

    const successRate = (totalPassed / categories.length) * 100;
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

    if (totalFailed > 0) {
      console.log('\n🔧 To fix issues:');
      console.log('1. Run: npm run lint:fix    (Fix ESLint issues)');
      console.log('2. Run: npm run format:fix  (Fix Prettier issues)');
      console.log('3. Run: npm run security:fix (Fix security issues)');
      console.log('4. Check TypeScript errors and fix them');
      console.log('5. Improve test coverage if needed');

      process.exit(1);
    } else {
      console.log('\n🎉 All code quality checks passed!');
      console.log('🚀 Your code is ready for production!');
    }
  }
}

// Run the checks
if (require.main === module) {
  const checker = new CodeQualityChecker();
  checker.runAllChecks().catch(console.error);
}

module.exports = CodeQualityChecker;
