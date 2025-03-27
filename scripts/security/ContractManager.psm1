using namespace System.Collections.Generic
using namespace System.Collections.Concurrent

# Configuration for contract management
$ContractConfig = @{
    Templates = @{
        StoreOwner = @{
            Path = "templates/store_owner_contract.docx"
            RequiredFields = @(
                "BusinessName",
                "OwnerName",
                "BusinessAddress",
                "BusinessType",
                "TaxId",
                "LicenseNumber"
            )
            ExpirationDays = 365
        }
        Driver = @{
            Path = "templates/driver_contract.docx"
            RequiredFields = @(
                "FullName",
                "DriversLicense",
                "VehicleInfo",
                "InsuranceNumber",
                "ServiceAreas"
            )
            ExpirationDays = 180
        }
    }
    Storage = @{
        BasePath = "contracts"
        BusinessFolder = "businesses"
        DriverFolder = "drivers"
        BackupFolder = "backups"
    }
    Notifications = @{
        RenewalReminderDays = @(30, 14, 7, 3, 1)
        ExpirationWarningDays = @(30, 14, 7, 3, 1)
    }
    Security = @{
        RequireMFA = $true
        AllowedFileTypes = @(".pdf", ".docx", ".jpg", ".png")
        MaxFileSize = 10MB
        RetentionPeriod = 730  # days
    }
}

function New-ContractManager {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$BasePath,
        
        [Parameter(Mandatory=$false)]
        [PSObject]$SecurityMonitor,
        
        [Parameter(Mandatory=$false)]
        [PSObject]$Reporter
    )
    
    $manager = [PSCustomObject]@{
        BasePath = $BasePath
        Config = $ContractConfig
        SecurityMonitor = $SecurityMonitor
        Reporter = $Reporter
        State = @{
            ActiveContracts = [ConcurrentDictionary[string,object]]::new()
            PendingSignatures = [ConcurrentDictionary[string,object]]::new()
            DocumentQueue = [ConcurrentQueue[object]]::new()
        }
    }
    
    # Method to generate a new contract
    $manager | Add-Member -MemberType ScriptMethod -Name GenerateContract -Value {
        param(
            [string]$ContractType,
            [hashtable]$UserData,
            [hashtable]$Options
        )
        
        # Validate contract type
        $template = $this.Config.Templates[$ContractType]
        if (-not $template) {
            throw "Invalid contract type: $ContractType"
        }
        
        # Validate required fields
        foreach ($field in $template.RequiredFields) {
            if (-not $UserData.ContainsKey($field)) {
                throw "Missing required field: $field"
            }
        }
        
        # Generate contract ID
        $contractId = [System.Guid]::NewGuid().ToString()
        
        # Create contract object
        $contract = @{
            Id = $contractId
            Type = $ContractType
            Status = "Draft"
            UserData = $UserData
            Created = Get-Date
            Modified = Get-Date
            ExpirationDate = (Get-Date).AddDays($template.ExpirationDays)
            Documents = @()
            Signatures = @()
            History = @()
            Options = $Options
        }
        
        # Add to active contracts
        $this.State.ActiveContracts.TryAdd($contractId, $contract)
        
        # Log contract generation
        $this.LogContractEvent($contractId, "Generated", "Contract generated with template: $ContractType")
        
        return $contract
    }
    
    # Method to queue document for processing
    $manager | Add-Member -MemberType ScriptMethod -Name QueueDocument -Value {
        param(
            [string]$ContractId,
            [string]$DocumentPath,
            [string]$DocumentType,
            [hashtable]$Metadata
        )
        
        # Validate contract exists
        $contract = $this.State.ActiveContracts[$ContractId]
        if (-not $contract) {
            throw "Contract not found: $ContractId"
        }
        
        # Validate file type
        $extension = [System.IO.Path]::GetExtension($DocumentPath)
        if (-not $this.Config.Security.AllowedFileTypes.Contains($extension)) {
            throw "Invalid file type: $extension"
        }
        
        # Create document object
        $document = @{
            Id = [System.Guid]::NewGuid().ToString()
            ContractId = $ContractId
            Path = $DocumentPath
            Type = $DocumentType
            Status = "Pending"
            Metadata = $Metadata
            UploadTime = Get-Date
        }
        
        # Add to processing queue
        $this.State.DocumentQueue.Enqueue($document)
        
        # Log document queued
        $this.LogContractEvent($ContractId, "DocumentQueued", "Document queued for processing: $DocumentType")
        
        return $document
    }
    
    # Method to process document queue
    $manager | Add-Member -MemberType ScriptMethod -Name ProcessDocumentQueue -Value {
        $documents = @()
        $document = $null
        
        while ($this.State.DocumentQueue.TryDequeue([ref]$document)) {
            try {
                # Get contract
                $contract = $this.State.ActiveContracts[$document.ContractId]
                if (-not $contract) {
                    throw "Contract not found: $($document.ContractId)"
                }
                
                # Process document based on type
                switch ($document.Type) {
                    "BusinessLicense" {
                        # Validate business license
                        $this.ValidateBusinessLicense($document)
                    }
                    "DriversLicense" {
                        # Validate driver's license
                        $this.ValidateDriversLicense($document)
                    }
                    "Insurance" {
                        # Validate insurance document
                        $this.ValidateInsurance($document)
                    }
                    default {
                        # Generic document validation
                        $this.ValidateDocument($document)
                    }
                }
                
                # Update document status
                $document.Status = "Processed"
                $document.ProcessedTime = Get-Date
                
                # Add to contract documents
                $contract.Documents = @($contract.Documents) + @($document)
                
                # Log document processed
                $this.LogContractEvent($document.ContractId, "DocumentProcessed", "Document processed successfully: $($document.Type)")
                
                # Add to processed documents
                $documents += $document
            }
            catch {
                # Update document status
                $document.Status = "Failed"
                $document.Error = $_.Exception.Message
                
                # Log document processing failure
                $this.LogContractEvent($document.ContractId, "DocumentProcessingFailed", "Failed to process document: $_")
                
                # Raise alert if security monitor is available
                if ($this.SecurityMonitor) {
                    $this.SecurityMonitor.RaiseAlert(
                        "DocumentProcessing",
                        "Warning",
                        "Document processing failed for contract $($document.ContractId)",
                        @{
                            ContractId = $document.ContractId
                            DocumentType = $document.Type
                            Error = $_.Exception.Message
                        }
                    )
                }
                
                # Add to processed documents
                $documents += $document
            }
        }
        
        return $documents
    }
    
    # Method to initiate contract signing
    $manager | Add-Member -MemberType ScriptMethod -Name InitiateContractSigning -Value {
        param(
            [string]$ContractId,
            [string[]]$Signers,
            [hashtable]$Options
        )
        
        # Validate contract exists
        $contract = $this.State.ActiveContracts[$ContractId]
        if (-not $contract) {
            throw "Contract not found: $ContractId"
        }
        
        # Create signing request
        $signingRequest = @{
            Id = [System.Guid]::NewGuid().ToString()
            ContractId = $ContractId
            Status = "Pending"
            Signers = $Signers | ForEach-Object {
                @{
                    Email = $_
                    Status = "Pending"
                    SentTime = Get-Date
                }
            }
            Options = $Options
            Created = Get-Date
            Modified = Get-Date
            ExpirationDate = (Get-Date).AddDays(7)
        }
        
        # Add to pending signatures
        $this.State.PendingSignatures.TryAdd($signingRequest.Id, $signingRequest)
        
        # Send signing requests
        foreach ($signer in $signingRequest.Signers) {
            $this.SendSigningRequest($signingRequest.Id, $signer.Email)
        }
        
        # Log signing initiated
        $this.LogContractEvent($ContractId, "SigningInitiated", "Contract signing initiated for $($Signers.Count) signers")
        
        return $signingRequest
    }
    
    # Method to process contract signature
    $manager | Add-Member -MemberType ScriptMethod -Name ProcessSignature -Value {
        param(
            [string]$SigningRequestId,
            [string]$SignerEmail,
            [string]$SignatureData
        )
        
        # Validate signing request exists
        $signingRequest = $this.State.PendingSignatures[$SigningRequestId]
        if (-not $signingRequest) {
            throw "Signing request not found: $SigningRequestId"
        }
        
        # Find signer
        $signer = $signingRequest.Signers | Where-Object { $_.Email -eq $SignerEmail }
        if (-not $signer) {
            throw "Signer not found: $SignerEmail"
        }
        
        # Update signer status
        $signer.Status = "Signed"
        $signer.SignedTime = Get-Date
        $signer.SignatureData = $SignatureData
        
        # Check if all signatures collected
        $allSigned = -not ($signingRequest.Signers | Where-Object { $_.Status -eq "Pending" })
        if ($allSigned) {
            # Update contract status
            $contract = $this.State.ActiveContracts[$signingRequest.ContractId]
            $contract.Status = "Signed"
            $contract.Signatures = @($contract.Signatures) + @($signingRequest.Signers)
            
            # Remove from pending signatures
            $null = $this.State.PendingSignatures.TryRemove($SigningRequestId, [ref]$null)
            
            # Log contract signed
            $this.LogContractEvent($signingRequest.ContractId, "ContractSigned", "All signatures collected")
            
            # Send notifications
            $this.NotifyContractSigned($signingRequest.ContractId)
        }
        
        # Log signature processed
        $this.LogContractEvent($signingRequest.ContractId, "SignatureProcessed", "Signature processed for $SignerEmail")
        
        return $allSigned
    }
    
    # Method to log contract events
    $manager | Add-Member -MemberType ScriptMethod -Name LogContractEvent -Value {
        param(
            [string]$ContractId,
            [string]$EventType,
            [string]$Message
        )
        
        $event = @{
            Timestamp = Get-Date
            ContractId = $ContractId
            EventType = $EventType
            Message = $Message
        }
        
        # Add to contract history
        $contract = $this.State.ActiveContracts[$ContractId]
        if ($contract) {
            $contract.History += $event
        }
        
        # Send to reporter if available
        if ($this.Reporter) {
            $this.Reporter.LogEvent("ContractManagement", $event)
        }
    }
    
    # Method to validate business license
    $manager | Add-Member -MemberType ScriptMethod -Name ValidateBusinessLicense -Value {
        param(
            [hashtable]$Document
        )
        
        # Validate document metadata
        if (-not $Document.Metadata.IssueDate -or -not $Document.Metadata.ExpiryDate) {
            throw "Missing required metadata: IssueDate or ExpiryDate"
        }
        
        # Check if license is expired
        if ($Document.Metadata.ExpiryDate -lt (Get-Date)) {
            throw "Business license is expired"
        }
        
        # Add validation result to document
        $Document.ValidationResult = @{
            IsValid = $true
            ValidatedAt = Get-Date
            ExpiryDate = $Document.Metadata.ExpiryDate
        }
    }
    
    # Method to validate driver's license
    $manager | Add-Member -MemberType ScriptMethod -Name ValidateDriversLicense -Value {
        param(
            [hashtable]$Document
        )
        
        # Validate document metadata
        if (-not $Document.Metadata.IssueDate -or -not $Document.Metadata.ExpiryDate) {
            throw "Missing required metadata: IssueDate or ExpiryDate"
        }
        
        # Check if license is expired
        if ($Document.Metadata.ExpiryDate -lt (Get-Date)) {
            throw "Driver's license is expired"
        }
        
        # Add validation result to document
        $Document.ValidationResult = @{
            IsValid = $true
            ValidatedAt = Get-Date
            ExpiryDate = $Document.Metadata.ExpiryDate
        }
    }
    
    # Method to validate insurance
    $manager | Add-Member -MemberType ScriptMethod -Name ValidateInsurance -Value {
        param(
            [hashtable]$Document
        )
        
        # Validate document metadata
        if (-not $Document.Metadata.Coverage -or -not $Document.Metadata.Amount -or -not $Document.Metadata.ExpiryDate) {
            throw "Missing required metadata: Coverage, Amount, or ExpiryDate"
        }
        
        # Check if insurance is expired
        if ($Document.Metadata.ExpiryDate -lt (Get-Date)) {
            throw "Insurance is expired"
        }
        
        # Check minimum coverage amount
        if ($Document.Metadata.Amount -lt 1000000) {
            throw "Insurance coverage amount is below minimum requirement"
        }
        
        # Add validation result to document
        $Document.ValidationResult = @{
            IsValid = $true
            ValidatedAt = Get-Date
            ExpiryDate = $Document.Metadata.ExpiryDate
            Coverage = $Document.Metadata.Coverage
            Amount = $Document.Metadata.Amount
        }
    }
    
    # Method to validate generic document
    $manager | Add-Member -MemberType ScriptMethod -Name ValidateDocument -Value {
        param(
            [hashtable]$Document
        )
        
        # Basic file validation
        if (-not (Test-Path $Document.Path)) {
            throw "Document file not found"
        }
        
        # Check file size
        $fileInfo = Get-Item $Document.Path
        if ($fileInfo.Length -gt $this.Config.Security.MaxFileSize) {
            throw "Document exceeds maximum file size"
        }
        
        # Add validation result to document
        $Document.ValidationResult = @{
            IsValid = $true
            ValidatedAt = Get-Date
            FileSize = $fileInfo.Length
        }
    }
    
    # Method to send signing request
    $manager | Add-Member -MemberType ScriptMethod -Name SendSigningRequest -Value {
        param(
            [string]$SigningRequestId,
            [string]$SignerEmail
        )
        
        # Get signing request
        $signingRequest = $this.State.PendingSignatures[$SigningRequestId]
        if (-not $signingRequest) {
            throw "Signing request not found: $SigningRequestId"
        }
        
        # Get contract
        $contract = $this.State.ActiveContracts[$signingRequest.ContractId]
        if (-not $contract) {
            throw "Contract not found: $signingRequest.ContractId"
        }
        
        # Create signing link (in production, this would be a secure URL)
        $signingLink = "https://drifti.com/sign/$SigningRequestId/$($SignerEmail.Replace('@', '_'))"
        
        # Send email notification if reporter is available
        if ($this.Reporter) {
            $this.Reporter.SendEmailAlert(@{
                Type = "Contract Signing Request"
                RiskLevel = "Low"
                Description = "Please sign the Drifti $($contract.Type) contract"
                Source = "Contract Manager"
                RiskScore = 0.1
                Timestamp = Get-Date
                Data = @{
                    ContractId = $contract.Id
                    SigningRequestId = $SigningRequestId
                    SigningLink = $signingLink
                }
            })
        }
    }
    
    # Method to notify contract signed
    $manager | Add-Member -MemberType ScriptMethod -Name NotifyContractSigned -Value {
        param(
            [string]$ContractId
        )
        
        # Get contract
        $contract = $this.State.ActiveContracts[$ContractId]
        if (-not $contract) {
            throw "Contract not found: $ContractId"
        }
        
        # Send notification if reporter is available
        if ($this.Reporter) {
            $this.Reporter.SendEmailAlert(@{
                Type = "Contract Signed"
                RiskLevel = "Low"
                Description = "All parties have signed the $($contract.Type) contract"
                Source = "Contract Manager"
                RiskScore = 0.1
                Timestamp = Get-Date
                Data = @{
                    ContractId = $contract.Id
                    ContractType = $contract.Type
                    Signatures = $contract.Signatures
                }
            })
        }
    }
    
    return $manager
}

# Export module members
Export-ModuleMember -Function New-ContractManager 