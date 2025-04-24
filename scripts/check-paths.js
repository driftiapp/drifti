const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packages = [
    'frontend',
    'backend',
    'shared'
];

console.log('🔍 Checking path resolution across all packages...\n');

let hasErrors = false;

packages.forEach(pkg => {
    console.log(`\n📦 Checking ${pkg}...`);
    const pkgPath = path.join(__dirname, '..', pkg);

    // Check if package has tsconfig.json
    const tsconfigPath = path.join(pkgPath, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
        console.error(`❌ ${pkg} is missing tsconfig.json`);
        hasErrors = true;
        return;
    }

    // Check if package has proper path aliases
    const tsconfig = require(tsconfigPath);
    const paths = tsconfig.compilerOptions?.paths || {};

    // Check for common path aliases
    const requiredAliases = ['@/*', '@shared/*'];
    const missingAliases = requiredAliases.filter(alias => !paths[alias]);

    if (missingAliases.length > 0) {
        console.error(`❌ ${pkg} is missing required path aliases: ${missingAliases.join(', ')}`);
        hasErrors = true;
    } else {
        console.log(`✅ ${pkg} has proper path aliases`);
    }

    // Check if package can resolve its imports
    try {
        execSync('npx tsc --noEmit', {
            cwd: pkgPath,
            stdio: 'inherit'
        });
        console.log(`✅ ${pkg} can resolve all imports`);
    } catch (error) {
        console.error(`❌ ${pkg} has import resolution errors`);
        hasErrors = true;
    }
});

if (hasErrors) {
    console.error('\n❌ Path check failed in one or more packages');
    process.exit(1);
} else {
    console.log('\n✅ All path checks passed!');
} 