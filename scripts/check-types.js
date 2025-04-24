const { execSync } = require('child_process');
const path = require('path');

const packages = [
    'frontend',
    'backend',
    'shared'
];

console.log('🔍 Running type checks across all packages...\n');

let hasErrors = false;

packages.forEach(pkg => {
    console.log(`\n📦 Checking ${pkg}...`);
    try {
        execSync('npx tsc --noEmit', {
            cwd: path.join(__dirname, '..', pkg),
            stdio: 'inherit'
        });
        console.log(`✅ ${pkg} types are valid`);
    } catch (error) {
        console.error(`❌ ${pkg} has type errors`);
        hasErrors = true;
    }
});

if (hasErrors) {
    console.error('\n❌ Type check failed in one or more packages');
    process.exit(1);
} else {
    console.log('\n✅ All type checks passed!');
} 