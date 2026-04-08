# Agent Rules for Yet Another Retro Tool

## Project Coding Standards

This document defines the coding standards and conventions that must be followed across the Yet Another Retro Tool project.
These rules ensure consistency, maintainability, and a better developer experience.

## 1. String Formatting Standard

**Rule**: All strings must use single quotes instead of double quotes, except in specific use-cases

**Applies to**: All TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`)

**Examples**:

```typescript
// ✅ Correct - use single quotes
const message = 'Hello world'
const apiUrl = 'https://api.example.com'
const possesiveUsage = "This is my friend's dog!" // Double quotes should be used to allow for apostrophes
const template = `Welcome ${name}!` // Template literals are fine

// ❌ Incorrect - avoid double quotes
const message = "Hello world"
const apiUrl = "https://api.example.com"
```

**Rationale**: Single quotes are more concise and consistent with modern JavaScript/TypeScript conventions.

## 2. File Structure Standard

**Rule**: All files must end with exactly one line of whitespace.

**Applies to**: All source files

**Purpose**:

- Ensures consistent file endings across the codebase
- Provides proper git diffs without "No newline at end of file" warnings
- Follows POSIX standard for text files

**Implementation**: Configure your editor to automatically add a final newline and trim extra whitespace.

## 3. Import Organization Standard

**Rule**: Imports must be organized in the following order with alphabetical sorting within each group:

1. **Third-party library imports** (React, Express, external npm packages)
2. **Local imports** (relative paths, workspace packages like `@yet-another-retro-tool/shared`)
3. **Alphabetical order** within each group

**Examples**:

```typescript
// ✅ Correct import order
import React, { useState, useEffect } from 'react'
import { Button } from '@radix-ui/react-slot'
import express from 'express'
import { cva } from 'class-variance-authority'

import { ApiResponse, CreateRoomRequest } from '@yet-another-retro-tool/shared'
import { roomApi } from '@/utils/api'
import { cn } from '@/lib/utils'
import { validateInput } from '../utils/validation'

// ❌ Incorrect - mixed order
import { roomApi } from '@/utils/api'
import React from 'react'
import { ApiResponse } from '@yet-another-retro-tool/shared'
import express from 'express'
```

**Rationale**:

- Clear separation between external dependencies and internal code
- Alphabetical ordering makes imports easy to find and prevents duplicates
- Consistent structure across all files

## 4. Project-Specific Patterns

### Monorepo Structure

- Use workspace imports for shared packages: `@yet-another-retro-tool/shared`
- Maintain clear boundaries between `frontend/`, `backend/`, and `shared/` packages
- Keep shared types and constants in the `shared` package

### API Conventions

- Use consistent error response format: `{ success: false, error: 'Error Type', message: 'User message' }`
- All API responses should follow `ApiResponse<T>` interface from shared package
- Use semantic error categories: 'Validation Error', 'Not Found', 'Internal Server Error'

### Design documentation

- All features must have documentation explaining them at least at a high-level
- DO NOT include implementation details in the docs. Links to files are okay.
- Documentation should be markdown files
- API Specs are required / highly recommended
- Mermaid diagrams are highly recommended
- Documentation should be understood by humans and AIs
- Markdown files should adhere to [CommonMark spec](https://spec.commonmark.org/0.31.2/)
- All markdown files must pass `markdownlint` validation before committing
- Line length limit: 120 characters (except for code blocks, tables, and headings)
- Lists must be surrounded by blank lines for readability
- Files must end with exactly one newline character

### Accessibility Requirements

- All form inputs must have proper labels (no placeholder-only labels)
- Interactive elements must be keyboard accessible
- Use semantic HTML and ARIA attributes appropriately

### Design System Integration

- Use design tokens from CSS variables instead of hardcoded colors
- Follow Marmalade Design System patterns and components
- Maintain consistent spacing using Tailwind spacing tokens

## Enforcement

These rules should be followed by all contributors. Current enforcement tools:

- ESLint for TypeScript/JavaScript code quality
- Markdownlint for documentation quality (`npx markdownlint docs/`)
- Prettier configuration for consistent formatting

Future enhancements may include:

- Pre-commit hooks to validate compliance
- Automated linting in CI/CD pipeline

## Questions or Clarifications

If you have questions about these rules or need clarification on specific cases,
please discuss them during code review or team meetings to ensure consistent interpretation across the project.
