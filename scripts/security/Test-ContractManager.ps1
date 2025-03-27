# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psm1" -Force
Import-Module "$PSScriptRoot\SecurityMonitor.psm1" -Force
Import-Module "$PSScriptRoot\ContractManager.psm1" -Force

# Create output directory for contracts
$outputDir = Join-Path $PSScriptRoot "..\..\contracts"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Host "`n📋 Testing Contract Management System"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Initialize components
Write-Host "📝 Initializing Components..."
$reporter = New-SecurityReporter -OutputPath $outputDir
$monitor = New-SecurityMonitor -DataPath $outputDir -Reporter $reporter
$contractManager = New-ContractManager -BasePath $outputDir -SecurityMonitor $monitor -Reporter $reporter

# Test Store Owner Contract
Write-Host "`n🏪 Testing Store Owner Contract Generation..."
$storeOwnerData = @{
    BusinessName = "Drifti Test Store"
    OwnerName = "John Smith"
    BusinessAddress = "123 Test St, City, State 12345"
    BusinessType = "Convenience Store"
    TaxId = "12-3456789"
    LicenseNumber = "BL123456"
}

$storeContract = $contractManager.GenerateContract(
    "StoreOwner",
    $storeOwnerData,
    @{
        ServiceTypes = @("Food Delivery", "Liquor Delivery")
        CommissionRate = 0.15
        PaymentTerms = "Net 30"
    }
)

Write-Host "  • Generated store owner contract: $($storeContract.Id)"

# Queue document for processing
$documentPath = Join-Path $outputDir "test_business_license.pdf"
"Test Business License" | Out-File -FilePath $documentPath
$document = $contractManager.QueueDocument(
    $storeContract.Id,
    $documentPath,
    "BusinessLicense",
    @{
        IssueDate = (Get-Date).AddMonths(-1)
        ExpiryDate = (Get-Date).AddYears(1)
    }
)

Write-Host "  • Queued business license for processing: $($document.Id)"

# Test Driver Contract
Write-Host "`n🚗 Testing Driver Contract Generation..."
$driverData = @{
    FullName = "Jane Doe"
    DriversLicense = "DL987654"
    VehicleInfo = "2022 Toyota Camry"
    InsuranceNumber = "INS123456"
    ServiceAreas = @("Downtown", "Suburbs")
}

$driverContract = $contractManager.GenerateContract(
    "Driver",
    $driverData,
    @{
        ServiceTypes = @("Ride-Share", "Food Delivery")
        CommissionRate = 0.20
        BackgroundCheckStatus = "Passed"
    }
)

Write-Host "  • Generated driver contract: $($driverContract.Id)"

# Queue driver documents
$documentPath = Join-Path $outputDir "test_drivers_license.pdf"
"Test Driver's License" | Out-File -FilePath $documentPath
$document = $contractManager.QueueDocument(
    $driverContract.Id,
    $documentPath,
    "DriversLicense",
    @{
        IssueDate = (Get-Date).AddYears(-2)
        ExpiryDate = (Get-Date).AddYears(3)
    }
)

Write-Host "  • Queued driver's license for processing: $($document.Id)"

$documentPath = Join-Path $outputDir "test_insurance.pdf"
"Test Insurance Document" | Out-File -FilePath $documentPath
$document = $contractManager.QueueDocument(
    $driverContract.Id,
    $documentPath,
    "Insurance",
    @{
        Coverage = "Commercial"
        Amount = 1000000
        ExpiryDate = (Get-Date).AddYears(1)
    }
)

Write-Host "  • Queued insurance document for processing: $($document.Id)"

# Process document queue
Write-Host "`n📄 Processing Document Queue..."
$contractManager.ProcessDocumentQueue()

# Test contract signing
Write-Host "`n✍️ Testing Contract Signing..."

# Initiate store owner contract signing
$storeSigningRequest = $contractManager.InitiateContractSigning(
    $storeContract.Id,
    @("john.smith@test.com", "legal@drifti.com"),
    @{
        SigningOrder = "parallel"
        ReminderInterval = 24  # hours
    }
)

Write-Host "  • Initiated store owner contract signing: $($storeSigningRequest.Id)"

# Process store owner signatures
$contractManager.ProcessSignature(
    $storeSigningRequest.Id,
    "john.smith@test.com",
    "John Smith Digital Signature"
)

Write-Host "  • Processed store owner signature"

$contractManager.ProcessSignature(
    $storeSigningRequest.Id,
    "legal@drifti.com",
    "Drifti Legal Team Signature"
)

Write-Host "  • Processed Drifti legal team signature"

# Initiate driver contract signing
$driverSigningRequest = $contractManager.InitiateContractSigning(
    $driverContract.Id,
    @("jane.doe@test.com", "operations@drifti.com"),
    @{
        SigningOrder = "sequential"
        ReminderInterval = 24  # hours
    }
)

Write-Host "  • Initiated driver contract signing: $($driverSigningRequest.Id)"

# Process driver signatures
$contractManager.ProcessSignature(
    $driverSigningRequest.Id,
    "jane.doe@test.com",
    "Jane Doe Digital Signature"
)

Write-Host "  • Processed driver signature"

$contractManager.ProcessSignature(
    $driverSigningRequest.Id,
    "operations@drifti.com",
    "Drifti Operations Team Signature"
)

Write-Host "  • Processed Drifti operations team signature"

# Display contract status
Write-Host "`n📊 Contract Status:"
Write-Host "  Store Owner Contract: $($storeContract.Status)"
Write-Host "  Driver Contract: $($driverContract.Status)"

Write-Host "`n✨ Testing complete!" 