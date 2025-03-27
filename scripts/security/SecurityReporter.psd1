@{
    ModuleVersion = '1.0'
    GUID = 'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a'
    Author = 'Security Team'
    Description = 'Security Reporter Module'
    PowerShellVersion = '5.1'
    RootModule = 'SecurityReporter.psm1'
    FunctionsToExport = @(
        'New-SecurityReporter',
        'Test-EmailConnection',
        'Test-SlackConnection',
        'Test-TeamsConnection',
        'Test-TwilioConnection',
        'Test-WebhookConnection'
    )
} 