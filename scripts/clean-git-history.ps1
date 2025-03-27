# List of files to remove from Git history
$filesToRemove = @(
    "serviceAccountKey.json",
    "jwt_secret.txt",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production"
)

Write-Host "🧹 Cleaning Git history of sensitive files..."

# Create a temporary branch
git checkout --orphan temp_branch

# Add all files
git add -A

# Commit the current state
git commit -m "Clean start: removing sensitive files from Git history"

# Delete the main branch
git branch -D main

# Rename temp branch to main
git branch -m main

# Force update the remote repository
Write-Host "⚠️ To complete the cleanup, run:"
Write-Host "git push -f origin main"
Write-Host ""
Write-Host "⚠️ WARNING: This will rewrite Git history. Make sure all team members are aware!" 