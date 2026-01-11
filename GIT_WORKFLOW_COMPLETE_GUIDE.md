# Complete Git Workflow Guide
## Professional Development to Production Process

**Date Created:** January 10, 2026  
**Project:** Blog-Creator Application  
**Feature Implemented:** Save Changes Button

---

## Table of Contents
1. [Overview](#overview)
2. [Branch Strategy](#branch-strategy)
3. [The Complete Workflow](#the-complete-workflow)
4. [Detailed Step-by-Step Process](#detailed-step-by-step-process)
5. [Testing at Each Stage](#testing-at-each-stage)
6. [Common Commands Reference](#common-commands-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide documents the complete professional git workflow from feature development to production deployment. This process ensures code quality, proper testing, and safe deployment practices.

### Why This Workflow?

- **Safety:** Changes are tested before reaching production
- **Collaboration:** Pull requests allow for code review
- **History:** Clear git history shows what changed and why
- **Rollback:** Easy to revert if something goes wrong
- **Professionalism:** Industry-standard development practice

---

## Branch Strategy

### Three Main Branches

```
main (production)
  ↑
develop (staging/testing)
  ↑
feature/branch-name (development)
```

**Main Branch:**
- Production-ready code only
- Users access this version
- Tagged with version numbers (v1.0.0, v1.1.0, etc.)
- Never commit directly to main

**Develop Branch:**
- Integration branch for features
- Testing ground before production
- All features merge here first
- More stable than feature branches

**Feature Branches:**
- One branch per feature/fix
- Named descriptively: `feature/add-save-button`, `fix/login-bug`
- Deleted after merging
- Can have multiple at once

---

## The Complete Workflow

### High-Level Process

```
1. Create feature branch from develop
2. Implement feature
3. Test on feature branch
4. Commit changes
5. Push to GitHub
6. Create Pull Request (feature → develop)
7. Review PR
8. Merge to develop
9. Test on develop branch
10. Create Pull Request (develop → main)
11. Merge to main (production)
12. Update version number
13. Create release tag
14. Clean up feature branch
```

---

## Detailed Step-by-Step Process

### Phase 1: Setup and Feature Development

#### Step 1: Check Current Status
```bash
git status
git branch
```

**What this does:** Shows which branch you're on and if there are uncommitted changes.

#### Step 2: Switch to Develop Branch
```bash
git checkout develop
```

**What this does:** Switches to the develop branch, which is your starting point for new features.

#### Step 3: Pull Latest Changes
```bash
git pull origin develop
```

**What this does:** Gets the latest code from GitHub to ensure you're working with the most recent version.

#### Step 4: Create Feature Branch
```bash
git checkout -b feature/add-save-button
```

**What this does:** Creates a new branch for your feature. The `-b` flag means "create and switch to."

**Naming Convention:**
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation
- `refactor/description` - for code improvements

#### Step 5: Implement Your Feature

Make your code changes. In our case:
- Modified `app.js` to add `/api/save-changes` endpoint
- Updated `views/index.handlebars` to add Save Changes button
- Added confirmation dialog and success messages

**Key Principle:** Work only on ONE feature per branch. Don't mix unrelated changes.

#### Step 6: Test Locally

Start your application:
```bash
npm start
```

Test the feature thoroughly:
- Create new content
- Edit existing content
- Use the new save changes button
- Verify confirmation dialog appears
- Check that changes persist
- Verify files are updated on disk

**Important:** Never commit untested code!

#### Step 7: Check What Changed
```bash
git status
git diff
```

**What this does:** 
- `git status` shows which files changed
- `git diff` shows exactly what lines changed

#### Step 8: Stage Your Changes
```bash
git add app.js views/index.handlebars
```

**What this does:** Marks files to be included in the next commit.

**Note:** Only add files related to your feature. Don't use `git add .` without checking first.

#### Step 9: Commit Your Changes
```bash
git commit -m "feat: Add save changes button to edit section

- Add new /api/save-changes endpoint to save changes directly to index.md
- Track current blog ID when saving a blog
- Add 'Save Changes' button in edit tab that appears after initial save
- Include confirmation dialog before saving changes
- Show success message when changes are saved to both local and Hugo directories"
```

**Commit Message Format:**
```
<type>: <short description>

- Detailed point 1
- Detailed point 2
- Detailed point 3
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting (no logic change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

### Phase 2: Pushing to GitHub and Creating Pull Request

#### Step 10: Push Feature Branch to GitHub
```bash
git push -u origin feature/add-save-button
```

**What this does:** 
- Uploads your branch to GitHub
- `-u` sets up tracking so future pushes can just use `git push`

**Potential Issue:** If you committed `node_modules/`, GitHub may reject the push due to secrets.

**Solution:**
```bash
# Remove from tracking
git rm -r --cached node_modules

# Commit the removal
git commit -m "chore: Remove node_modules from git tracking"

# Clean history if needed
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r node_modules" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push -u origin feature/add-save-button --force
```

#### Step 11: Create Pull Request (Feature → Develop)

**Using GitHub CLI:**
```bash
gh pr create --base develop --head feature/add-save-button \
  --title "feat: Add save changes button to edit section" \
  --body "## Changes
- Add new /api/save-changes endpoint
- Add Save Changes button in edit tab
- Include confirmation dialog
- Show success messages

## Testing
- [x] Test creating a new blog post
- [x] Test editing existing blog post  
- [x] Test save changes button functionality
- [x] Verify confirmation dialog appears
- [x] Confirm changes persist in both directories"
```

**Using GitHub Website:**
1. Go to your repository on GitHub
2. Click "Pull requests" tab
3. Click "New pull request"
4. Base: `develop` ← Compare: `feature/add-save-button`
5. Add title and description
6. Click "Create pull request"

**What this does:** Creates a request to merge your feature into develop. This allows for:
- Code review
- Discussion
- Automated testing (if set up)
- Documentation of changes

---

### Phase 3: Testing and Merging to Develop

#### Step 12: Review the Pull Request

On GitHub, you can:
- See all changed files
- Review line-by-line changes
- Add comments
- Request changes
- Approve

**In our case:** We reviewed and the feature looked good!

#### Step 13: Merge to Develop

**Using GitHub CLI:**
```bash
gh pr merge 1 --merge --delete-branch
```

**Using GitHub Website:**
1. Click "Merge pull request" button
2. Choose "Create a merge commit"
3. Click "Confirm merge"
4. Delete the feature branch (optional but recommended)

**What this does:** Merges your feature into the develop branch and optionally deletes the remote feature branch.

#### Step 14: Update Local Develop Branch
```bash
git checkout develop
git pull origin develop
```

**What this does:** Switches to develop and pulls the newly merged code.

#### Step 15: Delete Local Feature Branch
```bash
git branch -d feature/add-save-button
```

**What this does:** Deletes your local feature branch since it's been merged. The code is now in develop.

#### Step 16: Test on Develop Branch

Restart your application:
```bash
# Kill any running instance
lsof -ti:3030 | xargs kill -9

# Start from develop branch
npm start
```

**Test Everything Again:**
- All previous tests
- Make sure it works with other features
- Verify nothing broke

**Why test again?** 
- Other code might have been merged since you started
- Integration issues might appear
- Conflicts might have been resolved incorrectly

---

### Phase 4: Production Release

#### Step 17: Create Pull Request (Develop → Main)

**Using GitHub CLI:**
```bash
gh pr create --base main --head develop \
  --title "Release v1.2.0: Add save changes feature" \
  --body "## Production Release

### Features Added:
- Save changes button in edit section
- Direct saving to index.md files
- Confirmation dialog before saving
- Success feedback messages

### Testing:
- [x] Tested on feature branch
- [x] Tested on develop branch
- [x] Ready for production

### Files Changed:
- app.js: Added /api/save-changes endpoint
- views/index.handlebars: Added Save Changes button"
```

**What this does:** Creates a PR to merge all tested code from develop into production (main).

#### Step 18: Merge to Main

**Using GitHub CLI:**
```bash
gh pr merge 2 --merge
```

**What this does:** Merges develop into main. Your code is now in production!

#### Step 19: Update Local Main Branch
```bash
git checkout main
git pull origin main
```

#### Step 20: Update Version Number

Edit `package.json`:
```json
{
  "version": "1.2.0"  // Changed from 1.1.0
}
```

**Version Numbering (Semantic Versioning):**
- `MAJOR.MINOR.PATCH` (e.g., 1.2.0)
- **MAJOR:** Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR:** New features, backward compatible (e.g., 1.1.0 → 1.2.0)
- **PATCH:** Bug fixes (e.g., 1.2.0 → 1.2.1)

Commit and push:
```bash
git add package.json
git commit -m "chore: Bump version to 1.2.0"
git push origin main
```

#### Step 21: Create Release Tag
```bash
git tag -a v1.2.0 -m "Release v1.2.0 - Add save changes button feature"
git push origin v1.2.0
```

**What this does:** Creates a permanent marker in git history for this release. You can always go back to this exact version.

---

## Testing at Each Stage

### Why Test Multiple Times?

Each stage represents a different environment:
1. **Feature Branch:** Your isolated changes
2. **Develop Branch:** Your changes + other features
3. **Main Branch:** Production verification

### Testing Checklist at Each Stage

**Feature Branch Testing:**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] UI looks correct
- [ ] Data saves properly
- [ ] Edge cases handled

**Develop Branch Testing:**
- [ ] Feature still works
- [ ] Other features still work
- [ ] No conflicts or integration issues
- [ ] Performance is good

**Main Branch Testing (Optional but Recommended):**
- [ ] Final smoke test
- [ ] Critical paths work
- [ ] Ready for users

---

## Common Commands Reference

### Checking Status
```bash
git status                    # Show current status
git branch                    # List local branches
git branch -a                 # List all branches (including remote)
git log --oneline -5          # Show last 5 commits
git diff                      # Show unstaged changes
git diff --staged             # Show staged changes
```

### Branch Operations
```bash
git checkout develop          # Switch to develop
git checkout -b feature/name  # Create and switch to new branch
git branch -d feature/name    # Delete local branch
git push origin --delete feature/name  # Delete remote branch
```

### Making Changes
```bash
git add file.js               # Stage specific file
git add .                     # Stage all changes (use carefully!)
git commit -m "message"       # Commit with message
git commit --amend            # Modify last commit
```

### Syncing with GitHub
```bash
git pull origin develop       # Pull latest from develop
git push origin feature/name  # Push feature branch
git push -u origin feature/name  # Push and set up tracking
git fetch --all               # Get all remote changes (no merge)
```

### Pull Requests (GitHub CLI)
```bash
gh pr create                  # Create PR interactively
gh pr list                    # List all PRs
gh pr view 1                  # View PR #1
gh pr merge 1                 # Merge PR #1
```

### Tagging
```bash
git tag                       # List all tags
git tag -a v1.2.0 -m "msg"    # Create annotated tag
git push origin v1.2.0        # Push specific tag
git push origin --tags        # Push all tags
```

### Fixing Mistakes
```bash
git reset HEAD file.js        # Unstage file
git checkout -- file.js       # Discard changes to file
git reset --hard HEAD         # Discard all local changes
git revert <commit-hash>      # Undo a commit (safe)
```

---

## Troubleshooting

### Issue: Can't Push - "node_modules contains secrets"

**Problem:** GitHub blocks pushes with sensitive files.

**Solution:**
```bash
# Remove from tracking
git rm -r --cached node_modules

# Commit removal
git commit -m "chore: Remove node_modules from git tracking"

# If it's in history, clean it
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r node_modules" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push -u origin feature/name --force
```

### Issue: Branch Already Exists

**Problem:** You try to create a branch that exists.

**Solution:**
```bash
# Switch to existing branch
git checkout feature/name

# Or delete and recreate
git branch -d feature/name
git checkout -b feature/name
```

### Issue: Merge Conflicts

**Problem:** Git can't automatically merge changes.

**Solution:**
1. Open conflicted files
2. Look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Their changes
   >>>>>>> branch-name
   ```
3. Manually resolve by keeping what you want
4. Remove conflict markers
5. Stage and commit:
   ```bash
   git add file.js
   git commit -m "fix: Resolve merge conflict"
   ```

### Issue: Forgot to Create Feature Branch

**Problem:** You made changes directly on develop/main.

**Solution:**
```bash
# Create branch with current changes
git checkout -b feature/forgot

# Now develop/main goes back
git checkout develop
git reset --hard origin/develop
```

### Issue: Need to Undo Last Commit

**Problem:** You committed something wrong.

**Solution:**
```bash
# Undo commit, keep changes
git reset --soft HEAD~1

# Undo commit, discard changes
git reset --hard HEAD~1

# Already pushed? Use revert instead
git revert HEAD
```

### Issue: Wrong Branch Name

**Problem:** You created a branch with a typo.

**Solution:**
```bash
# Rename current branch
git branch -m old-name new-name

# If already pushed
git push origin --delete old-name
git push -u origin new-name
```

---

## Best Practices

### Do's ✅

- **Always** create a feature branch for changes
- **Always** test before committing
- **Always** write clear commit messages
- **Always** pull before pushing
- **Always** review your changes before committing
- **Keep** commits focused and atomic
- **Use** meaningful branch names
- **Delete** branches after merging
- **Tag** production releases
- **Update** version numbers for releases

### Don'ts ❌

- **Never** commit directly to main
- **Never** commit `node_modules/`
- **Never** commit sensitive data (API keys, passwords)
- **Never** force push to shared branches (main, develop)
- **Never** commit untested code
- **Never** mix unrelated changes in one commit
- **Never** use vague commit messages ("fix stuff", "update")
- **Never** skip testing on develop
- **Don't** leave feature branches unmerged for long

---

## Summary

This workflow ensures:
1. **Safe development** - Work is isolated in feature branches
2. **Proper testing** - Test at each stage before promotion
3. **Clear history** - Know what changed, when, and why
4. **Easy rollback** - Can revert to any tagged version
5. **Team collaboration** - Pull requests enable code review
6. **Professional standards** - Industry best practices

**The Golden Rule:** Always test, never skip steps, keep main stable.

---

## Quick Reference Card

```
Feature Development:
1. git checkout develop
2. git pull origin develop
3. git checkout -b feature/name
4. [Make changes]
5. [Test locally]
6. git add files
7. git commit -m "message"
8. git push -u origin feature/name

Pull Request & Merge:
9. gh pr create --base develop --head feature/name
10. [Review & merge on GitHub]
11. git checkout develop
12. git pull origin develop
13. [Test on develop]

Production Release:
14. gh pr create --base main --head develop
15. [Merge to main on GitHub]
16. git checkout main
17. git pull origin main
18. [Update version in package.json]
19. git add package.json
20. git commit -m "chore: Bump version"
21. git push origin main
22. git tag -a vX.Y.Z -m "Release vX.Y.Z"
23. git push origin vX.Y.Z
```

---

**Created:** January 10, 2026  
**Last Updated:** January 10, 2026  
**Project:** Blog-Creator Application
