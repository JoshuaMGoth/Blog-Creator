# Git Workflow Guide: Development to Production

A comprehensive guide for managing your Blog-Creator application from development through production deployment using Git and GitHub.

---

## Table of Contents
1. [Introduction](#introduction)
2. [Version Management](#version-management)
3. [Branch Strategy](#branch-strategy)
4. [Development Workflow](#development-workflow)
5. [Creating a Feature](#creating-a-feature)
6. [Testing](#testing)
7. [Pull Requests](#pull-requests)
8. [Merging & Releasing](#merging--releasing)
9. [Production Deployment](#production-deployment)
10. [Hotfixes](#hotfixes)
11. [Common Git Commands](#common-git-commands)

---

## Introduction

This guide follows **Git Flow** methodology, a proven branching model for managing releases and features. It ensures:
- Clean main branch (production-ready code)
- Organized feature development
- Easy hotfix management
- Clear versioning system
- Rollback capability if needed

**Your Project:**
- Repository: `JoshuaMGoth/Blog-Creator`
- Current Version: `1.1.0`
- Current Branch: `main`

---

## Version Management

### Semantic Versioning (SemVer)

Follow the format: **MAJOR.MINOR.PATCH**

Example: `1.2.3`

- **MAJOR** (1.x.x) - Breaking changes, completely new features
- **MINOR** (x.2.x) - New features that are backward compatible
- **PATCH** (x.x.3) - Bug fixes and small improvements

### When to Increment Versions

| Change Type | Example | New Version |
|------------|---------|-------------|
| Bug fix | Fix preview rendering issue | PATCH (1.1.1) |
| New feature | Add save button to preview | MINOR (1.2.0) |
| Breaking change | Change API structure | MAJOR (2.0.0) |
| Multiple features + fixes | Feature + fixes combined | MINOR (1.2.0) |

### Where Versions Live

1. **package.json** - Primary source of truth
2. **Git Tags** - Mark releases in Git history
3. **GitHub Releases** - Public announcement of versions

---

## Branch Strategy

### Branch Types

#### 1. **main** (Production Branch)
- **Purpose:** Production-ready code only
- **Protection:** Requires pull requests, all tests pass
- **Who can merge:** Usually only via pull requests
- **Created from:** develop
- **Tags:** Every merge gets a version tag (v1.2.0)

#### 2. **develop** (Integration Branch)
- **Purpose:** Pre-production, combines features
- **Created from:** main
- **Features merged here:** All feature branches
- **Purpose:** Base for all feature branches

#### 3. **feature/\*** (Feature Branches)
- **Naming:** `feature/descriptive-name`
- **Examples:**
  - `feature/add-save-button`
  - `feature/dark-mode`
  - `feature/fix-markdown-rendering`
- **Created from:** develop
- **Merged back to:** develop (via PR)
- **Deleted after:** Merged

#### 4. **hotfix/\*** (Emergency Fixes)
- **Naming:** `hotfix/fix-description`
- **Example:** `hotfix/fix-production-crash`
- **Created from:** main
- **Merged back to:** main AND develop
- **Used for:** Urgent production fixes

---

## Development Workflow

### Step 1: Update Your Local Repository

Always start with the latest code:

```bash
cd /home/jmgoth/Desktop/web-apps/Blog-Creator

# Fetch latest changes from GitHub
git fetch origin

# Update main branch
git checkout main
git pull origin main

# Update develop branch
git checkout develop
git pull origin develop
```

### Step 2: Create a Feature Branch

```bash
# From develop branch
git checkout develop

# Create and switch to feature branch
git checkout -b feature/add-save-button

# Verify you're on the right branch
git branch
# Output: * feature/add-save-button
#           develop
#           main
```

### Step 3: Make Your Changes

- Edit files as needed
- Test frequently
- Commit regularly with clear messages

### Step 4: Commit Your Changes

Good commit messages are essential:

```bash
# Stage specific files
git add app.js

# Or stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add save button to preview section

- Add save functionality to directly update index.md
- Include confirmation dialog before saving
- Display success/error messages to user"
```

**Commit Message Conventions:**
- Use type prefix: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- Be descriptive
- Keep first line under 50 characters
- Explain why, not what (the code shows what)

### Step 5: Push to GitHub

```bash
# Push your feature branch
git push origin feature/add-save-button

# If it's the first push of this branch, use -u flag
git push -u origin feature/add-save-button
```

---

## Testing

### Local Testing Checklist

Before requesting a code review:

1. **Start the application**
   ```bash
   npm install  # Install any new dependencies
   npm run dev  # Start development server
   ```

2. **Test the feature manually**
   - Open http://localhost:3030
   - Test the save button functionality
   - Verify file is created/updated in blogs folder
   - Check error handling (what if file can't be written?)
   - Test in both light and dark modes

3. **Test existing functionality**
   - Ensure your changes didn't break other features
   - Create a blog normally
   - Edit preview
   - Delete blog
   - View settings

4. **Check console for errors**
   - Open browser DevTools (F12)
   - Watch for JavaScript errors
   - Check Network tab for failed requests

### Unit Testing (Optional but Recommended)

For larger projects, consider adding tests:

```bash
npm install --save-dev jest
npm test  # Run tests
```

---

## Pull Requests

### Creating a Pull Request on GitHub

1. **Go to your repository:** https://github.com/JoshuaMGoth/Blog-Creator

2. **Click "Pull requests" tab**

3. **Click "New pull request"**

4. **Set the branches:**
   - **Base:** develop (where your changes go)
   - **Compare:** feature/add-save-button (your feature branch)

5. **Fill in the PR details:**

   **Title:** Brief summary
   ```
   Add save button to preview section
   ```

   **Description:** Use the template below
   ```markdown
   ## Description
   Adds a save button to the preview/edit section that allows users to save changes directly to the index.md file.

   ## Related Issues
   Closes #123 (if applicable)

   ## Changes Made
   - Added save button to preview section
   - Implemented file write functionality
   - Added confirmation dialog
   - Added success/error messaging

   ## Testing Performed
   - Tested saving new content
   - Tested error handling
   - Verified file permissions work correctly
   - Tested in light and dark modes

   ## Screenshots
   [Add screenshots if UI changed]

   ## Breaking Changes
   None

   ## Deploy Notes
   No database migrations needed
   ```

6. **Review your own changes** (diff tab)

7. **Click "Create pull request"**

### Code Review Process

- Wait for feedback from collaborators
- Respond to comments
- Make requested changes
- Push new commits (same branch)
- Request review again when ready
- All checks should pass (if you have CI/CD set up)

---

## Merging & Releasing

### Merging a Feature (After Approval)

**Option A: GitHub UI (Recommended)**

1. Go to the PR
2. Click "Squash and merge" button
3. Confirm the commit message
4. Click "Confirm squash and merge"

**Option B: Command Line**

```bash
# Update develop with latest
git checkout develop
git pull origin develop

# Merge feature branch
git merge feature/add-save-button

# Push to GitHub
git push origin develop

# Delete the feature branch (cleanup)
git branch -d feature/add-save-button
git push origin --delete feature/add-save-button
```

### Creating a Release (Deploying to Production)

Once features are tested in develop and ready for production:

#### Step 1: Update Version Number

```bash
# Switch to main
git checkout main
git pull origin main

# Switch to develop to create release
git checkout develop

# Make sure develop is up to date
git pull origin develop
```

#### Step 2: Update version in package.json

Edit `package.json`:

```json
{
  "name": "blog-creator-app",
  "version": "1.2.0",  // Changed from 1.1.0
  ...
}
```

#### Step 3: Commit Version Bump

```bash
git add package.json
git commit -m "chore: Bump version to 1.2.0"
```

#### Step 4: Create a Release Branch

```bash
git checkout -b release/1.2.0
git push origin release/1.2.0
```

#### Step 5: Create Pull Request to Main

1. Go to GitHub
2. Create PR from `release/1.2.0` to `main`
3. Title: `Release v1.2.0`
4. In description, list all changes:

```markdown
## Release v1.2.0

### New Features
- Add save button to preview section (#124)

### Bug Fixes
- Fixed markdown rendering issue (#120)

### Documentation
- Updated README with new features

### Breaking Changes
None
```

5. Merge with "Create a merge commit" (not squash)
6. Delete release branch

#### Step 6: Create GitHub Release

1. Go to https://github.com/JoshuaMGoth/Blog-Creator/releases
2. Click "Create a new release"
3. **Tag:** `v1.2.0`
4. **Target:** `main`
5. **Title:** `Release v1.2.0`
6. **Description:** Paste your changelog

```markdown
## What's New in v1.2.0

### Features
- Save button in preview/edit section for direct index.md updates
- Confirmation dialog before saving changes

### Improvements
- Better error handling for file operations

### Bug Fixes
- Fixed markdown rendering edge cases

[Download .zip or .tar.gz if applicable]
```

7. Click "Publish release"

#### Step 7: Back-merge to Develop

```bash
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## Production Deployment

### Before Deployment Checklist

- [ ] Feature tested locally
- [ ] PR reviewed and approved
- [ ] All tests passing
- [ ] Version number updated
- [ ] CHANGELOG.md updated
- [ ] Release created on GitHub
- [ ] Documentation updated if needed

### Deployment Steps

The exact steps depend on your hosting (DigitalOcean, Heroku, AWS, etc.)

**General process:**

```bash
# SSH into your production server
ssh user@your-production-server.com

# Navigate to project directory
cd /path/to/Blog-Creator

# Pull latest from main
git fetch origin
git checkout main
git pull origin main

# Verify the version
cat package.json | grep version

# Install/update dependencies
npm install --production

# Restart application (method depends on process manager)
pm2 restart blog-creator
# OR
systemctl restart blog-creator
# OR
docker restart blog-creator-container
```

### Verify Deployment

```bash
# Check if app is running
curl http://your-production-server.com

# Check logs
pm2 logs blog-creator
# OR
journalctl -u blog-creator -f
# OR
docker logs -f blog-creator-container
```

### Rollback if Needed

```bash
# On production server
git checkout main
git pull origin main

# Go back to previous release
git checkout v1.1.0

# Restart
pm2 restart blog-creator
```

---

## Hotfixes

### When to Use Hotfixes

- Critical bug in production
- Security issue
- Data loss issue

### Hotfix Process

#### Step 1: Create Hotfix Branch

```bash
# From main
git checkout main
git pull origin main

git checkout -b hotfix/fix-production-crash
```

#### Step 2: Fix the Bug

Make your changes and test thoroughly.

#### Step 3: Update Version (PATCH)

```bash
# In package.json: 1.2.0 → 1.2.1
git add package.json
git commit -m "chore: Bump version to 1.2.1"
```

#### Step 4: Merge to Main

```bash
git push origin hotfix/fix-production-crash
```

Create PR to `main`, merge, and create release (follow Release steps above).

#### Step 5: Merge Back to Develop

```bash
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## Common Git Commands

### Viewing Status and History

```bash
# See current status
git status

# See commit history
git log --oneline

# See your branch
git branch -a

# See changes in current branch
git diff

# See what will be committed
git diff --staged
```

### Undoing Changes

```bash
# Undo changes to a file (not yet staged)
git checkout -- filename.js

# Unstage a file
git reset HEAD filename.js

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Go back to specific commit
git checkout abc123def
```

### Working with Remote

```bash
# See all remotes
git remote -v

# Fetch without merging
git fetch origin

# Update current branch
git pull origin branch-name

# Push current branch
git push origin branch-name

# Push all branches
git push origin --all

# Push tags
git push origin --tags
```

### Tags (for releases)

```bash
# Create a tag
git tag -a v1.2.0 -m "Version 1.2.0"

# Push tags to GitHub
git push origin --tags

# See all tags
git tag -l

# Delete local tag
git tag -d v1.2.0

# Delete remote tag
git push origin --delete v1.2.0
```

---

## Real-World Example: Blog-Creator Feature

Here's the complete workflow for adding the save button feature:

### Phase 1: Setup (5 minutes)

```bash
# Update local code
git fetch origin
git checkout main && git pull origin main
git checkout develop && git pull origin develop

# Create feature branch
git checkout -b feature/add-save-button

# Verify
git branch
```

### Phase 2: Development (30 minutes)

```bash
# Make changes to app.js and views/index.handlebars
# Use npm run dev to test

# When ready, commit
git add app.js views/index.handlebars
git commit -m "feat: Add save button to preview section

- Saves changes directly to index.md file
- Includes confirmation dialog
- Shows success/error feedback"

# Push to GitHub
git push -u origin feature/add-save-button
```

### Phase 3: Testing (15 minutes)

- Test locally thoroughly
- Ask someone to review on GitHub

### Phase 4: Review (varies)

```bash
# Reviewer approves your PR
# If changes requested:
git add app.js
git commit -m "fix: Address code review feedback"
git push origin feature/add-save-button
```

### Phase 5: Merge & Release (10 minutes)

```bash
# Merge is done on GitHub via PR

# Back on your machine:
git checkout develop
git pull origin develop

# Update version
# Edit package.json: 1.1.0 → 1.2.0
git add package.json
git commit -m "chore: Bump version to 1.2.0"

# Create release branch
git checkout -b release/1.2.0
git push origin release/1.2.0

# Create PR on GitHub (release/1.2.0 → main)
# Merge on GitHub
# Create Release on GitHub

# Back-merge to develop
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

### Phase 6: Production Deployment (5 minutes)

```bash
# On production server:
git checkout main && git pull origin main
npm install
pm2 restart blog-creator

# Verify
curl http://your-domain.com
```

---

## Tips for Success

1. **Commit often** - Small, focused commits are easier to review and revert
2. **Write good commit messages** - Future you will thank you
3. **Pull before pushing** - Always sync with remote first
4. **Test before PR** - Don't waste review time
5. **One feature per branch** - Easier to manage
6. **Keep branches short-lived** - Delete after merging
7. **Review your own code first** - Catch issues before asking others
8. **Use descriptive branch names** - `feature/add-dark-mode` not `feature/stuff`

---

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)

---

**Last Updated:** January 10, 2026  
**Version:** 1.0  
**Author:** Development Team
