# Contributing to NEXUS

Thank you for your interest in contributing to NEXUS! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- Detailed description of the proposed feature
- Any possible implementation details
- Why this enhancement would be useful

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run type-check
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   - Use conventional commits format:
     - `feat:` new feature
     - `fix:` bug fix
     - `docs:` documentation changes
     - `style:` formatting changes
     - `refactor:` code refactoring
     - `test:` adding tests
     - `chore:` maintenance tasks

   Example:
   ```bash
   git commit -m "feat: add AI resume generator"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure all CI checks pass

## Development Setup

### Prerequisites

- Node.js 20 or higher
- npm
- Git

### Installation

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ETCHERO.git
   cd ETCHERO
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
nexus-platform/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # UI primitives
│   ├── layout/         # Layout components
│   └── features/       # Feature components
├── lib/                # Utility functions
├── types/              # TypeScript types
├── docs/               # Documentation
└── public/             # Static assets
```

## Coding Guidelines

### TypeScript

- Always use TypeScript
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types from `types/index.ts`

### React Components

- Use functional components with hooks
- Prefer named exports
- Keep components small and focused
- Use proper prop types

Example:
```typescript
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Button({ variant = "primary", children }: ButtonProps) {
  return <button className={variant}>{children}</button>;
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use the `cn()` utility for conditional classes
- Keep styles consistent with design system

### File Naming

- Components: PascalCase (e.g., `Button.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase (e.g., `User.ts`)
- Constants: UPPER_SNAKE_CASE

### Git Workflow

1. Always work on a feature branch
2. Keep commits atomic and well-described
3. Rebase on main before submitting PR
4. Squash commits if needed

## Testing

While we're setting up comprehensive testing, please:

- Test your changes manually
- Ensure the build succeeds
- Check for TypeScript errors
- Verify responsive design

## Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Update type definitions
- Include examples when helpful

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

## Recognition

Contributors will be recognized in the project README and release notes.

Thank you for contributing to NEXUS! 🚀
