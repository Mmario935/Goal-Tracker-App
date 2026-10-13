# Genera los iconos PNG de la app (iOS no acepta SVG como icono de inicio).
# Uso: powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force $out | Out-Null

function P([double]$x, [double]$y) { New-Object System.Drawing.PointF ([single]$x), ([single]$y) }

function New-Icon([int]$size, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $s = $size / 512.0

  # Fondo negro opaco (iOS pone negro donde hay transparencia)
  $g.Clear([System.Drawing.Color]::FromArgb(8, 8, 8))

  # Franjas diagonales rojas tenues
  $stripe = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 230, 0, 18))
  for ($i = -6; $i -lt 10; $i++) {
    $x = $i * 70 * $s
    $g.FillPolygon($stripe, @((P $x 0), (P ($x + 34 * $s) 0), (P ($x + 34 * $s - 300 * $s) (512 * $s)), (P ($x - 300 * $s) (512 * $s))))
  }

  # Estallido rojo irregular
  $cx = 256 * $s; $cy = 262 * $s
  $radii = @(200, 120, 185, 105, 215, 125, 175, 100, 205, 118, 190, 110, 210, 122, 180, 104)
  $pts = @()
  for ($k = 0; $k -lt $radii.Count; $k++) {
    $ang = -[Math]::PI / 2 + $k * 2 * [Math]::PI / $radii.Count + 0.12
    $pts += P ($cx + [Math]::Cos($ang) * $radii[$k] * $s) ($cy + [Math]::Sin($ang) * $radii[$k] * $s)
  }
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 0, 18))
  $shadow = $pts | ForEach-Object { P ($_.X + 14 * $s) ($_.Y + 14 * $s) }
  $g.FillPolygon($white, $shadow)
  $g.FillPolygon($red, $pts)

  # Flecha de progreso inclinada (blanca con borde negro)
  $arrow = @(
    (P (270 * $s) (140 * $s)), (P (352 * $s) (250 * $s)), (P (300 * $s) (250 * $s)),
    (P (284 * $s) (372 * $s)), (P (222 * $s) (372 * $s)), (P (238 * $s) (250 * $s)), (P (186 * $s) (250 * $s))
  )
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), (14 * $s)
  $pen.LineJoin = 'Miter'
  $g.DrawPolygon($pen, $arrow)
  $g.FillPolygon($white, $arrow)

  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 180 'apple-touch-icon.png'
New-Icon 192 'icon-192.png'
New-Icon 512 'icon-512.png'
Write-Host "Iconos generados en $out"
