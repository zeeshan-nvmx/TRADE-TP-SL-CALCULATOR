---
slug: upgrade-react-vite
description: Upgrade react/react-dom to 19.2.6, vite to 8.0.15, and @vitejs/plugin-react to 6.0.2
---

## Goal
Update React and Vite to latest stable versions without breaking the codebase.

## Changes
1. Update package.json version specifiers
2. Run npm install to resolve new lock file
3. Verify build passes (npm run build)
4. Commit changes

## Packages
- react: ^19.0.0 → ^19.2.6
- react-dom: ^19.0.0 → ^19.2.6
- vite: ^6.2.0 → ^8.0.0
- @vitejs/plugin-react: ^4.3.4 → ^6.0.0
