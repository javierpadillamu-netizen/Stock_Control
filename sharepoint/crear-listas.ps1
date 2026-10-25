<#
  Crea en SharePoint las 6 listas de la app Water, Stock y Pits.

  Requisitos:
    - PowerShell 7 y el modulo PnP.PowerShell:  Install-Module PnP.PowerShell -Scope CurrentUser
    - Un ClientId de una app de Entra ID para PnP. Si TI no tiene una, la crea un administrador con:
        Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP Produccion" -Tenant tuempresa.onmicrosoft.com

  Uso:
    ./crear-listas.ps1 -SiteUrl https://tuempresa.sharepoint.com/sites/Produccion -ClientId <id>

  Se puede ejecutar mas de una vez: las listas y columnas que ya existen se saltan.
#>
param(
    [Parameter(Mandatory)][string]$SiteUrl,
    [Parameter(Mandatory)][string]$ClientId
)

$ErrorActionPreference = "Stop"
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

$turnos    = "Am", "Day", "Night"
$areas     = "Argyle", "Forestry", "Irrigation Ride", "Western Paddocks", "Swan Gully South", "Swan Gully North"
$subareas  = "B1","B2","B3","B4","B5","B6","C1","C2","D1","F1","F2","G1","G2",
             "A1","A2","A3","A4","H1","I1","J1","H2","H3","I2","J2"
$ponds     = "Anaerobic Pond 1", "Anaerobic Pond 2", "Anaerobic Pond 3", "Facultative Pond 4",
             "Aeration Pond 5", "Cover Anaerobic Lagoon G1", "Cover Anaerobic Lagoon G2",
             "Cover Anaerobic Lagoon G3", "WWS Pond 10", "Lagoon 7", "Lagoon 8", "Lagoon 9"
$productos = "Poultry Meal (PM)", "Mixed Species (MBM)", "Tallow (MST)", "Poultry Oil (PO)",
             "Feather Meal (FM)", "Blood Meal (BM)"
$pits      = "1", "2", "3", "4", "5", "6", "7", "8"

function New-Lista($nombre) {
    if (-not (Get-PnPList -Identity $nombre -ErrorAction SilentlyContinue)) {
        New-PnPList -Title $nombre -Template GenericList -OnQuickLaunch | Out-Null
        Write-Host "Lista creada: $nombre"
    }
    # La columna Title pasa a ser "Ingresado por"
    Set-PnPField -List $nombre -Identity "Title" -Values @{ Title = "Ingresado por" } | Out-Null
}

function Add-Columna($lista, $nombre, $interno, $tipo, $opciones = $null) {
    if (Get-PnPField -List $lista -Identity $interno -ErrorAction SilentlyContinue) { return }
    $p = @{ List = $lista; DisplayName = $nombre; InternalName = $interno; Type = $tipo; AddToDefaultView = $true }
    if ($opciones) { $p.Choices = $opciones }
    Add-PnPField @p | Out-Null
    if ($tipo -eq "DateTime") {
        # Solo fecha, sin hora
        Set-PnPField -List $lista -Identity $interno -Values @{ DisplayFormat = 0 } | Out-Null
    }
}

function Add-Control($lista) {
    Add-Columna $lista "Modificado" "Modificado" "Boolean"
    Set-PnPField -List $lista -Identity "Modificado" -Values @{ DefaultValue = "0" } | Out-Null
    Add-Columna $lista "Modificado por" "ModificadoPor" "Text"
    Add-Columna $lista "Fecha de modificacion" "FechaModificacion" "DateTime"
    # Fecha de modificacion guarda tambien la hora
    Set-PnPField -List $lista -Identity "FechaModificacion" -Values @{ DisplayFormat = 1 } | Out-Null
}

# Irrigation
New-Lista "Irrigation"
Add-Columna "Irrigation" "Fecha" "Fecha" "DateTime"
Add-Columna "Irrigation" "Hora inicio" "HoraInicio" "Text"
Add-Columna "Irrigation" "Hora termino" "HoraTermino" "Text"
Add-Columna "Irrigation" "Area" "Area" "Choice" $areas
Add-Columna "Irrigation" "Subarea" "Subarea" "Choice" $subareas
Add-Columna "Irrigation" "Ml" "Ml" "Number"
Add-Control "Irrigation"

# River y Waste Water
foreach ($l in @(@("River", "River Water (Ml)"), @("Waste Water", "Waste Water (Ml)"))) {
    New-Lista $l[0]
    Add-Columna $l[0] "Fecha" "Fecha" "DateTime"
    Add-Columna $l[0] "Hora" "Hora" "Text"
    Add-Columna $l[0] $l[1] "Ml" "Number"
    Add-Control $l[0]
}

# Ponds
New-Lista "Ponds"
Add-Columna "Ponds" "Fecha" "Fecha" "DateTime"
Add-Columna "Ponds" "Hora" "Hora" "Text"
Add-Columna "Ponds" "Pond" "Pond" "Choice" $ponds
Add-Columna "Ponds" "Profundidad disponible (cm)" "ProfundidadCm" "Number"
Add-Control "Ponds"

# Stock
New-Lista "Stock"
Add-Columna "Stock" "Fecha" "Fecha" "DateTime"
Add-Columna "Stock" "Turno" "Turno" "Choice" $turnos
Add-Columna "Stock" "Producto" "Producto" "Choice" $productos
Add-Columna "Stock" "Stock (Tn)" "StockTn" "Number"
Add-Control "Stock"

# Pits
New-Lista "Pits"
Add-Columna "Pits" "Fecha" "Fecha" "DateTime"
Add-Columna "Pits" "Turno" "Turno" "Choice" $turnos
Add-Columna "Pits" "Numero de pit" "NumeroPit" "Choice" $pits
Add-Columna "Pits" "Cantidad de producto (Tn)" "CantidadTn" "Number"
Add-Control "Pits"

Write-Host "Listo: 6 listas creadas en $SiteUrl"
