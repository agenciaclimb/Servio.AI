# Remove logs grandes recursivamente no diretório atual
# Uso seguro: execute manualmente quando quiser liberar espaço

Get-ChildItem -Path . -Recurse -Include *.log -File -ErrorAction SilentlyContinue |
  ForEach-Object {
    try {
      Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop
      Write-Output ("Removed: {0}" -f $_.FullName)
    } catch {
      Write-Output ("Failed to remove: {0} ({1})" -f $_.FullName, $_.Exception.Message)
    }
  }
