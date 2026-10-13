# Genera los íconos PNG de la app (iOS no acepta SVG como ícono de inicio).
# Uso: powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force $out | Out-Null

function New-Icon([int]$size, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'

  # Fondo (sin transparencia: iOS pone negro donde hay alfa)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(58, 40, 110)), ([System.Drawing.Color]::FromArgb(20, 17, 31)), 45
  $g.FillRectangle($bg, $rect)

  # Escudo dorado
  $s = $size / 512.0
  $pts = @(
    (New-Object System.Drawing.PointF (256 * $s), (96 * $s)),
    (New-Object System.Drawing.PointF (392 * $s), (148 * $s)),
    (New-Object System.Drawing.PointF (380 * $s), (300 * $s)),
    (New-Object System.Drawing.PointF (256 * $s), (424 * $s)),
    (New-Object System.Drawing.PointF (132 * $s), (300 * $s)),
    (New-Object System.Drawing.PointF (120 * $s), (148 * $s))
  )
  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 197, 66))
  $g.FillPolygon($gold, $pts)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 236, 170)), (10 * $s)
  $pen.LineJoin = 'Round'
  $g.DrawPolygon($pen, $pts)

  # Flecha de progreso
  $dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 28, 80))
  $arrow = @(
    (New-Object System.Drawing.PointF (256 * $s), (160 * $s)),
    (New-Object System.Drawing.PointF (330 * $s), (250 * $s)),
    (New-Object System.Drawing.PointF (284 * $s), (250 * $s)),
    (New-Object System.Drawing.PointF (284 * $s), (350 * $s)),
    (New-Object System.Drawing.PointF (228 * $s), (350 * $s)),
    (New-Object System.Drawing.PointF (228 * $s), (250 * $s)),
    (New-Object System.Drawing.PointF (182 * $s), (250 * $s))
  )
  $g.FillPolygon($dark, $arrow)

  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 180 'apple-touch-icon.png'
New-Icon 192 'icon-192.png'
New-Icon 512 'icon-512.png'
Write-Host "Iconos generados en $out"
