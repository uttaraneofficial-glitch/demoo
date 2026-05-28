# Starto V2 - Backend Runner
# This script ensures Maven is available and runs the Spring Boot application.

$MAVEN_VERSION = "3.9.6"
$MAVEN_DIR = "$PSScriptRoot\.maven"
$MAVEN_ZIP = "$MAVEN_DIR\apache-maven-$MAVEN_VERSION-bin.zip"
$MAVEN_HOME = "$MAVEN_DIR\apache-maven-$MAVEN_VERSION"
$MVN_BIN = "$MAVEN_HOME\bin\mvn.cmd"

# Set JAVA_HOME (prioritize JDK 21 or highest available JDK version)
if (Test-Path "D:\OpenJDK21U-jdk_x64_windows_hotspot_21.0.10_7\jdk-21.0.10+7") {
    $env:JAVA_HOME = "D:\OpenJDK21U-jdk_x64_windows_hotspot_21.0.10_7\jdk-21.0.10+7"
} else {
    $jdkPath = Get-ChildItem -Path "C:\Program Files\Java" -Filter "jdk*" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    if ($jdkPath) {
        $env:JAVA_HOME = $jdkPath.FullName
    } elseif (Test-Path "D:\Android\jbr\bin\java.exe") {
        $env:JAVA_HOME = "D:\Android\jbr"
    } elseif (Test-Path "D:\bin\java.exe") {
        $env:JAVA_HOME = "D:\"
    } elseif ($null -eq $env:JAVA_HOME -or $env:JAVA_HOME -eq "") {
        $javaPath = where.exe java | Select-Object -First 1
        if ($javaPath) {
            $env:JAVA_HOME = [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetDirectoryName($javaPath))
        } else {
            # Fallback — requires JDK 17+
            $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
        }
    }
}
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# Load Environment Variables from starto-web/.env.local if available
$envFile = "$PSScriptRoot\starto-web\.env.local"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env.local..." -ForegroundColor Cyan
    Get-Content $envFile | Where-Object { $_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$' -and $_ -notmatch '^\s*#' } | ForEach-Object {
        $key = $Matches[1].Trim()
        $value = $Matches[2].Trim(" '`"")
        if ($value -ne '') {
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Set Default Environment Variables for Local Development
$env:DB_URL      = if ($env:DB_URL)      { $env:DB_URL }      else { "jdbc:postgresql://localhost:5432/starto" }
$env:DB_USERNAME = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "admin" }
$env:REDIS_HOST  = if ($env:REDIS_HOST)  { $env:REDIS_HOST }  else { "localhost" }
$env:REDIS_PORT  = if ($env:REDIS_PORT)  { $env:REDIS_PORT }  else { "6379" }
$env:PORT        = "9090"
$env:ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:9090"
$env:SPRING_JPA_HIBERNATE_DDL_AUTO = if ($env:SPRING_JPA_HIBERNATE_DDL_AUTO) { $env:SPRING_JPA_HIBERNATE_DDL_AUTO } else { $null } # Allow application.yml default or ENV override
$env:FIREBASE_CONFIG_PATH = "$PSScriptRoot\starto-api\src\main\resources\firebase-service-account.json"

# Priority 1: System Maven
$MVN_CMD = where.exe mvn.cmd | Select-Object -First 1

# Priority 2: Local Maven (download if missing)
if ($null -eq $MVN_CMD) {
    if (-not (Test-Path $MAVEN_DIR)) {
        New-Item -ItemType Directory -Path $MAVEN_DIR | Out-Null
    }

    if (-not (Test-Path $MVN_BIN)) {
        Write-Host "Maven not found. Downloading Maven $MAVEN_VERSION..." -ForegroundColor Cyan
        $url = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MAVEN_VERSION/apache-maven-$MAVEN_VERSION-bin.zip"
        Invoke-WebRequest -Uri $url -OutFile $MAVEN_ZIP
        
        Write-Host "Extracting Maven..." -ForegroundColor Cyan
        Expand-Archive -Path $MAVEN_ZIP -DestinationPath $MAVEN_DIR
        Remove-Item $MAVEN_ZIP
    }
    $MVN_CMD = $MVN_BIN
}

Write-Host "Starting Starto V3 Backend..." -ForegroundColor Green
Write-Host "Using Maven: $MVN_CMD" -ForegroundColor Gray
Set-Location -Path "$PSScriptRoot\starto-api"
& $MVN_CMD spring-boot:run