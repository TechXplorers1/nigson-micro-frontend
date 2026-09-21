$mfe = @{
    "shell" = 4200
    "marketing" = 4201
    "shop" = 4202
    "auth" = 4203
    "account" = 4204
    "admin-core" = 4205
    "admin-shop" = 4209
    "admin-cms" = 4210
}

Write-Host "Starting all Micro Frontends via http-server..."
foreach ($app in $mfe.GetEnumerator()) {
    $name = $app.Name
    $port = $app.Value
    Write-Host "Starting $name on port $port..."
    Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "http-server dist/$name -p $port --cors -s -c-1"
}
Write-Host "All apps started! Open http://localhost:4200 in your browser."
