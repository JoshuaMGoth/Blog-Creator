# Git Workflow Checklist
## Quick Reference for Feature Development to Production

---

## Pre-Work Setup

- [ ] Know what feature you're implementing
- [ ] Ensure current work is committed
- [ ] Close any running instances of the app

---

## Phase 1: Feature Development

### Setup (5 minutes)

- [ ] **Switch to develop branch**
  ```bash
  git checkout develop
  ```

- [ ] **Pull latest changes**
  ```bash
  git pull origin develop
  ```

- [ ] **Create feature branch**
  ```bash
  git checkout -b feature/descriptive-name
  ```
  
  Branch naming:
  - `feature/` - new feature
  - `fix/` - bug fix
  - `docs/` - documentation
  - `refactor/` - code improvement

### Development (Variable time)

- [ ] **Implement feature**
  - Write code
  - Keep changes focused on one feature
  
- [ ] **Test locally - First Pass**
  ```bash
  npm start
  ```
  Test checklist:
  - [ ] Feature works as designed
  - [ ] No console errors
  - [ ] UI looks correct
  - [ ] Data persists
  - [ ] Edge cases handled
  - [ ] Browser works (check http://localhost:3030)

- [ ] **Review your changes**
  ```bash
  git status
  git diff
  ```

- [ ] **Stage files**
  ```bash
  git add file1.js file2.html
  ```
  ⚠️ Only add files related to this feature!

- [ ] **Commit changes**
  ```bash
  git commit -m "type: Short description
  
  - Detailed change 1
  - Detailed change 2
  - Detailed change 3"
  ```
  
  Types: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

---

## Phase 2: Push to GitHub

### Upload Feature (2 minutes)

- [ ] **Push feature branch**
  ```bash
  git push -u origin feature/branch-name
  ```

- [ ] **If push fails (node_modules error)**
  ```bash
  git rm -r --cached node_modules
  git commit -m "chore: Remove node_modules from git tracking"
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch -r node_modules" \
    --prune-empty --tag-name-filter cat -- --all
  git push -u origin feature/branch-name --force
  ```

---

## Phase 3: Pull Request to Develop

### Create PR (3 minutes)

- [ ] **Create pull request**
  ```bash
  gh pr create --base develop --head feature/branch-name \
    --title "type: Feature description" \
    --body "Description of changes with testing checklist"
  ```

- [ ] **Review PR on GitHub**
  - Check all changed files
  - Verify changes are correct
  - Review description is clear

- [ ] **Merge PR**
  ```bash
  gh pr merge [PR-NUMBER] --merge --delete-branch
  ```

---

## Phase 4: Test on Develop

### Switch and Test (10 minutes)

- [ ] **Switch to develop**
  ```bash
  git checkout develop
  ```

- [ ] **Pull merged changes**
  ```bash
  git pull origin develop
  ```

- [ ] **Delete local feature branch**
  ```bash
  git branch -d feature/branch-name
  ```

- [ ] **Restart application**
  ```bash
  lsof -ti:3030 | xargs kill -9
  npm start
  ```

- [ ] **Test on develop - Second Pass**
  - [ ] Feature still works
  - [ ] Other features still work
  - [ ] No integration issues
  - [ ] Performance is acceptable
  - [ ] No console errors

---

## Phase 5: Release to Production

### Create Production PR (2 minutes)

- [ ] **Create PR from develop to main**
  ```bash
  gh pr create --base main --head develop \
    --title "Release vX.Y.Z: Feature summary" \
    --body "Production release notes"
  ```

- [ ] **Review production PR**
  - Verify all features are ready
  - Check no unfinished work
  - Confirm all tests passed

- [ ] **Merge to main**
  ```bash
  gh pr merge [PR-NUMBER] --merge
  ```

### Update Production (5 minutes)

- [ ] **Switch to main**
  ```bash
  git checkout main
  ```

- [ ] **Pull production code**
  ```bash
  git pull origin main
  ```

- [ ] **Update version number in package.json**
  - Change version: `"version": "X.Y.Z"`
  - Semantic versioning:
    - MAJOR.MINOR.PATCH
    - MAJOR: Breaking changes
    - MINOR: New features
    - PATCH: Bug fixes

- [ ] **Commit version bump**
  ```bash
  git add package.json
  git commit -m "chore: Bump version to X.Y.Z"
  git push origin main
  ```

- [ ] **Create release tag**
  ```bash
  git tag -a vX.Y.Z -m "Release vX.Y.Z - Feature description"
  git push origin vX.Y.Z
  ```

---

## Phase 6: Final Verification (Optional)

### Production Test (5 minutes)

- [ ] **Test on main branch**
  ```bash
  lsof -ti:3030 | xargs kill -9
  npm start
  ```

- [ ] **Run smoke tests**
  - [ ] App starts without errors
  - [ ] Critical features work
  - [ ] New feature works
  - [ ] Ready for users

---

## Cleanup

- [ ] **Switch back to develop for next feature**
  ```bash
  git checkout develop
  ```

- [ ] **View branches to confirm cleanup**
  ```bash
  git branch -a
  ```

- [ ] **Update documentation (if needed)**

---

## Quick Commands Reference

```bash
# Status checks
git status
git branch
git log --oneline -5

# Branch operations
git checkout develop
git checkout -b feature/name
git branch -d feature/name

# Syncing
git pull origin develop
git push -u origin feature/name

# Pull requests
gh pr create
gh pr merge [NUMBER]

# Tagging
git tag -a vX.Y.Z -m "message"
git push origin vX.Y.Z

# Emergency fixes
lsof -ti:3030 | xargs kill -9
git reset --soft HEAD~1
```

---

## Testing Checklist Template

Copy this for each test phase:

```
Feature Testing Checklist:
- [ ] Feature works as designed
- [ ] No console errors
- [ ] UI displays correctly
- [ ] Data saves properly
- [ ] Data persists after refresh
- [ ] Edge cases handled (empty input, long text, etc.)
- [ ] Cross-browser tested (if applicable)
- [ ] Mobile responsive (if applicable)
- [ ] Performance is acceptable
- [ ] No memory leaks
```

---

## Common Mistakes to Avoid

❌ **Don't:**
- Commit directly to main
- Skip testing phases
- Use vague commit messages
- Commit node_modules
- Force push to shared branches
- Leave feature branches unmerged

✅ **Do:**
- Create feature branches
- Test at each stage
- Write clear commit messages
- Review changes before committing
- Delete merged branches
- Tag releases

---

## Time Estimates

| Phase | Time |
|-------|------|
| Setup | 5 min |
| Development | Variable |
| Local Testing | 10 min |
| Push & PR to Develop | 5 min |
| Test on Develop | 10 min |
| PR to Main | 5 min |
| Version & Tag | 5 min |
| **Total (excluding dev)** | **40 min** |

---

## Emergency Procedures

### If something goes wrong:

**Wrong branch?**
```bash
git stash
git checkout correct-branch
git stash pop
```

**Need to undo commit?**
```bash
git reset --soft HEAD~1
```

**Merge conflict?**
1. Open conflicted files
2. Find `<<<<<<<`, `=======`, `>>>>>>>` markers
3. Choose which code to keep
4. Remove markers
5. `git add file && git commit`

**Need to rollback production?**
```bash
git checkout main
git revert HEAD
git push origin main
```

---

## Notes Section

Use this space to track specific details for your project:

**Last Release:**
- Version: _______
- Date: _______
- Features: _______

**Current Work:**
- Branch: _______
- Feature: _______
- Started: _______

**Next Steps:**
- [ ] _______
- [ ] _______
- [ ] _______

---

**Print this checklist and keep it handy!**

**Created:** January 10, 2026  
**Project:** Blog-Creator Application
