# Generates WAV clips for every course text with the Windows "Microsoft Zira Desktop" voice.
# Usage: powershell -File scripts/gen-audio.ps1 -ItemsPath items.json -OutDir wav
param(
  [Parameter(Mandatory = $true)][string]$ItemsPath,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$Voice = 'Microsoft Zira Desktop'
)
Add-Type -AssemblyName System.Speech
$items = Get-Content -Raw -Encoding UTF8 $ItemsPath | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice($Voice)
$s.Rate = -1
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
New-Item -ItemType Directory -Force $OutDir | Out-Null
$n = 0
foreach ($it in $items) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension($it.file) + '.wav'
  $wav = Join-Path $OutDir $name
  $s.SetOutputToWaveFile($wav, $fmt)
  $s.Speak($it.text)
  $n++
}
$s.SetOutputToNull()
$s.Dispose()
Write-Output "generated $n clips in $OutDir"
