# Lista arquivos maiores que 5MB fora de /public (recursivo)
# Uso: .\scripts\find_large_files.ps1

$minBytes = 5MB
Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object {
    -not ($_.FullName -match '\\(public|node_modules|\\.git|dist|build|\\.next|\\.vercel|coverage)\\') -and
    $_.Length -gt $minBytes
  } |
  Sort-Object Length -Descending |
  ForEach-Object {
    $mb = [math]::Round($_.Length / 1MB, 2)
    Write-Output ("{0}  -  {1} MB" -f $_.FullName, $mb)
  }
