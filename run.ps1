# Run GeoTIFF inspection for all landslide susceptibility rasters.
# Usage:
#   .\run.ps1
#   .\run.ps1 -File "GB sus.tif"
#   .\run.ps1 -Preview

param(
    [string]$File = "",
    [switch]$Preview,
    [switch]$Ui
)

Set-Location $PSScriptRoot

$argsList = @("view_rasters.py")
if ($File) {
    $argsList += $File
}
if ($Preview) {
    $argsList += "--preview"
}
if ($Ui) {
    $argsList += "--ui"
}

python @argsList
