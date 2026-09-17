$mfe = @{
    "shell" = 4200
    "mfe-marketing" = 4201
    "mfe-shop" = 4202
    "mfe-auth" = 4203
    "mfe-account" = 4204
    "mfe-admin-core" = 4205
    "mfe-admin-shop" = 4209
    "mfe-admin-cms" = 4210
}

Write-Host "Starting all Micro Frontends via http-server..."
foreach ($app in $mfe.GetEnumerator()) {
    $name = $app.Name
    $port = $app.Value
    Write-Host "Starting $name on port $port..."
    Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "http-server dist/$name -p $port --cors -s -c-1"
}
Write-Host "All apps started! Open http://localhost:4200 in your browser."
