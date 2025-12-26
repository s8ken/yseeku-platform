# Alternative: Push via GitHub CLI or Personal Access Token

## Option 1: GitHub CLI (Recommended)

If you have GitHub CLI installed:

```bash
cd /home/user/yseeku-platform

# Authenticate
gh auth login

# Push
git push -u origin main
```

## Option 2: Personal Access Token

Create a token at: https://github.com/settings/tokens/new

Required scopes:
- `repo` (full control of private repositories)

Then push with token:

```bash
cd /home/user/yseeku-platform

# Use token as password
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/s8ken/yseeku-platform.git

git push -u origin main
```

## Option 3: SSH Key

If you have SSH keys set up:

```bash
cd /home/user/yseeku-platform

# Change to SSH URL
git remote set-url origin git@github.com:s8ken/yseeku-platform.git

git push -u origin main
```

## Option 4: Download and Push Locally

If running in sandbox without auth:

```bash
# On your local machine:

# Clone from sandbox or download files
scp -r user@sandbox:/home/user/yseeku-platform ./

cd yseeku-platform

# Add remote (you'll be authenticated locally)
git remote add origin https://github.com/s8ken/yseeku-platform.git

# Push
git push -u origin main
```

## Verify Push

Once pushed, verify at:
https://github.com/s8ken/yseeku-platform

You should see:
- 53 files
- 4 packages (core, detect, lab, orchestrate)
- README.md with documentation
- Initial commit message
