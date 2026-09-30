Add-Type -AssemblyName System.Drawing

function Create-ErpIcon {
    param(
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded squircle background
    $radius = [Math]::Max(3, [int]($size * 0.25))
    $diameter = $radius * 2
    $pathRect = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathRect.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $pathRect.AddArc($size - $diameter, 0, $diameter, $diameter, 270, 90)
    $pathRect.AddArc($size - $diameter, $size - $diameter, $diameter, $diameter, 0, 90)
    $pathRect.AddArc(0, $size - $diameter, $diameter, $diameter, 90, 90)
    $pathRect.CloseFigure()

    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(0, 0),
        [System.Drawing.PointF]::new($size, $size),
        [System.Drawing.Color]::FromArgb(255, 59, 130, 246),
        [System.Drawing.Color]::FromArgb(255, 29, 78, 216)
    )
    $g.FillPath($brush, $pathRect)

    # Main 4-point sparkle star matching sidebar icon
    $s = $size / 64.0
    $pts = @(
        [System.Drawing.PointF]::new(32.0 * $s, 10.0 * $s),
        [System.Drawing.PointF]::new(37.5 * $s, 26.5 * $s),
        [System.Drawing.PointF]::new(54.0 * $s, 32.0 * $s),
        [System.Drawing.PointF]::new(37.5 * $s, 37.5 * $s),
        [System.Drawing.PointF]::new(32.0 * $s, 54.0 * $s),
        [System.Drawing.PointF]::new(26.5 * $s, 37.5 * $s),
        [System.Drawing.PointF]::new(10.0 * $s, 32.0 * $s),
        [System.Drawing.PointF]::new(26.5 * $s, 26.5 * $s)
    )
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $starPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $starPath.AddClosedCurve($pts, 0.15)
    $g.FillPath($whiteBrush, $starPath)

    if ($size -ge 32) {
        # Accent sparkle top-left
        $pts2 = @(
            [System.Drawing.PointF]::new(16.0 * $s, 11.0 * $s),
            [System.Drawing.PointF]::new(17.5 * $s, 14.5 * $s),
            [System.Drawing.PointF]::new(21.0 * $s, 16.0 * $s),
            [System.Drawing.PointF]::new(17.5 * $s, 17.5 * $s),
            [System.Drawing.PointF]::new(16.0 * $s, 21.0 * $s),
            [System.Drawing.PointF]::new(14.5 * $s, 17.5 * $s),
            [System.Drawing.PointF]::new(11.0 * $s, 16.0 * $s),
            [System.Drawing.PointF]::new(14.5 * $s, 14.5 * $s)
        )
        $star2 = New-Object System.Drawing.Drawing2D.GraphicsPath
        $star2.AddClosedCurve($pts2, 0.15)
        $g.FillPath($whiteBrush, $star2)

        # Accent sparkle bottom-right
        $pts3 = @(
            [System.Drawing.PointF]::new(48.0 * $s, 43.0 * $s),
            [System.Drawing.PointF]::new(49.5 * $s, 46.5 * $s),
            [System.Drawing.PointF]::new(53.0 * $s, 48.0 * $s),
            [System.Drawing.PointF]::new(49.5 * $s, 49.5 * $s),
            [System.Drawing.PointF]::new(48.0 * $s, 53.0 * $s),
            [System.Drawing.PointF]::new(46.5 * $s, 49.5 * $s),
            [System.Drawing.PointF]::new(43.0 * $s, 48.0 * $s),
            [System.Drawing.PointF]::new(46.5 * $s, 46.5 * $s)
        )
        $star3 = New-Object System.Drawing.Drawing2D.GraphicsPath
        $star3.AddClosedCurve($pts3, 0.15)
        $g.FillPath($whiteBrush, $star3)
    }

    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    return $bmp
}

$pubDir = Join-Path $PSScriptRoot "..\public"
if (-not (Test-Path $pubDir)) {
    New-Item -ItemType Directory -Path $pubDir -Force | Out-Null
}

$bmp16 = Create-ErpIcon -size 16 -outputPath (Join-Path $pubDir "favicon-16x16.png")
$bmp32 = Create-ErpIcon -size 32 -outputPath (Join-Path $pubDir "favicon-32x32.png")
$bmp180 = Create-ErpIcon -size 180 -outputPath (Join-Path $pubDir "apple-touch-icon.png")
$bmp192 = Create-ErpIcon -size 192 -outputPath (Join-Path $pubDir "android-chrome-192x192.png")
$bmp512 = Create-ErpIcon -size 512 -outputPath (Join-Path $pubDir "android-chrome-512x512.png")

# Generate favicon.ico
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$icoPath = Join-Path $pubDir "favicon.ico"
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()

Write-Output "Successfully generated all favicon files in $pubDir!"
