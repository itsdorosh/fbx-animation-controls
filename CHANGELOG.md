# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-26

### 🚨 BREAKING CHANGES
- Updated Three.js dependency from v0.139.2 to v0.180.0 (major version jump)
- Added `"type": "module"` to package.json for ES module support
- Fixed TypeScript definitions with corrected parameter types (may break existing TypeScript code)

### Added
- Modern development tooling (ESLint, Prettier, Jest)
- Comprehensive test suite with 16 test cases and 56% coverage
- Enhanced error handling and null safety checks
- Event dispatching for time changes (setTime, setPercentage)
- Development scripts for linting, formatting, and testing
- Jest setup with ES module support and Three.js mocking
- Coverage reporting with HTML and LCOV formats

### Changed
- Improved package.json with better metadata, keywords, and scripts
- Enhanced README with comprehensive API documentation and TypeScript examples
- Better .gitignore with coverage and build artifacts exclusion
- Fixed detach() method to use null instead of undefined consistently
- Improved getCurrentAnimationTimeDisplayString() to handle missing animations

### Fixed
- Fixed setTime() and setPercentage() methods to check for animation availability
- Fixed TypeScript definitions with correct parameter types and missing callback parameter
- Improved consistency in null vs undefined usage throughout codebase
- Fixed event system with proper callback parameter in TypeScript definitions

## [1.4.1] - Previous Release
- Initial stable release with basic FBX animation controls
