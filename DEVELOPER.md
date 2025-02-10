# Introduction

When you are reading this, you are likely to be a developer who is interested in contributing to the project. This document will guide you through the process of setting up the development environment and contributing to the project.

## Get started

### Step 1: Install

Neocache the library itself does not have any dependencies. However to develop it, you will need typescript, jest, etc.

```
npm install
```

### Step 2: Run the unit test

```
npm test
```

This command triggers jest to run all test cases in the `src` directory with the `.test.ts` extension. The tests verify:
- Basic cache operations
- Singleton pattern behavior
- Cache expiration functionality
- Automatic purging of expired items

### Step 3: Build

To build the project:

```
npm run build
```

This will:
1. Run TypeScript compiler
2. Generate JavaScript files in the `dist` directory
3. Create type definitions (`.d.ts` files)


## To start contributing
1. Read https://github.com/Jeanno/neocache/discussions/1 to learn about the road map
2. Start a discussion before writting any code to get clarification and alignment on the direction.
    - The discussion does not have to be long. It can be iterated multiple times to get to its final form.
4. Create a pull request
5. The pull request might also need a few iterations.
6. Accepted


### Code Style

- Use TypeScript for all new code
- Use eslint and prettier. We already have those specs in the repo.
- Follow existing code formatting

## Release Process

This will be handled by @jeanno

1. Update version in package.json
2. Run tests and build
3. Create a git tag
4. Push to npm registry
