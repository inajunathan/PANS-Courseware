# ============================================================
# PANS Courseware - 1-Click Interactive Slide Deck Uploader
# ============================================================
param(
    [string]$File,
    [string]$Code,
    [string]$Title,
    [int]$Pages = 20,
    [string]$Key
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 PANS Courseware: Interactive Slide Uploader" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

if (-not $File) {
    $File = Read-Host "📄 Enter file path (or drag & drop the PDF/PPTX/DOCX file into this window)"
}
$File = $File.Trim('"', "'").Trim()

if (-not $Code) {
    $Code = Read-Host "📚 Enter Course Code (e.g. PCG 501, PCH 401)"
}
$Code = $Code.Trim()

if (-not $Title) {
    $Title = Read-Host "📑 Enter Lecture Title (e.g. Herbal, Complimentary and Alternative Medicine)"
}
$Title = $Title.Trim()

$scriptPath = Join-Path $PSScriptRoot "scripts\upload_slide.mjs"

$argList = @(
    $scriptPath,
    "--file=$File",
    "--code=$Code",
    "--title=$Title",
    "--pages=$Pages"
)

if ($Key) {
    $argList += "--key=$Key"
}

node @argList
