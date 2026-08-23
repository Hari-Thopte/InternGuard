param (
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction Stop
    [void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
    [void][Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]
    [void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]

    $file = Get-Item -Path $ImagePath -ErrorAction Stop
    $asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }

    $storageFileTask = $asTaskMethod.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @([Windows.Storage.StorageFile]::GetFileFromPathAsync($file.FullName)))
    $storageFileTask.Wait()
    $storageFile = $storageFileTask.Result

    $streamTask = $asTaskMethod.MakeGenericMethod([Windows.Storage.Streams.IRandomAccessStreamWithContentType]).Invoke($null, @($storageFile.OpenReadAsync()))
    $streamTask.Wait()
    $stream = $streamTask.Result

    $decoderTask = $asTaskMethod.MakeGenericMethod([Windows.Graphics.Imaging.BitmapDecoder]).Invoke($null, @([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)))
    $decoderTask.Wait()
    $decoder = $decoderTask.Result

    $softwareBitmapTask = $asTaskMethod.MakeGenericMethod([Windows.Graphics.Imaging.SoftwareBitmap]).Invoke($null, @($decoder.GetSoftwareBitmapAsync()))
    $softwareBitmapTask.Wait()
    $softwareBitmap = $softwareBitmapTask.Result

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $engine) {
        $lang = [Windows.Globalization.Language]::new('en-US')
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    }

    if (-not $engine) {
        Write-Error "Windows Native OCR Engine could not be initialized."
        exit 1
    }

    $ocrTask = $asTaskMethod.MakeGenericMethod([Windows.Media.Ocr.OcrResult]).Invoke($null, @($engine.RecognizeAsync($softwareBitmap)))
    $ocrTask.Wait()
    $ocrResult = $ocrTask.Result

    Write-Output $ocrResult.Text
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
