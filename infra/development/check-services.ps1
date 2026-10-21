param([switch]$AllowDown, [switch]$Json)
$argsList = @()
if ($AllowDown) { $argsList += "--allow-down" }
if ($Json) { $argsList += "--json" }
node (Join-Path $PSScriptRoot "../../scripts/check-local-services.mjs") @argsList
exit $LASTEXITCODE
