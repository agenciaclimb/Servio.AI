# Fix eslint issues in ClientDashboard.tsx
$file = "components\ClientDashboard.tsx"
$content = Get-Content $file -Raw

# Remove handleViewRecommendations function (lines 212-226)
$content = $content -replace "(?s)  const handleViewRecommendations = async \(job: Job\) => \{.*?\n  \};\n\n", ""

# Replace console.log with void statement for unused providerId
$content = $content -replace "console\.log\(`Inviting provider \$\{providerId\} to job \$\{matchingJobId\}`\);", "void providerId; // Placeholder: awaiting backend invite endpoint"

Set-Content $file $content
Write-Host "Fixed linter issues in $file"
