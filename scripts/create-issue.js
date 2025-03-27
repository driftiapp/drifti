const { Octokit } = require('@octokit/rest');
const { trackError } = require('../backend/monitoring/errorMonitor');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function createIssue(error, context) {
  try {
    const title = `[Auto-Fix] ${error.message}`;
    const body = `
## Error Details
\`\`\`
${error.stack}
\`\`\`

## Context
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

## Action Required
Please review and fix the following issues:
1. ${error.message}
2. Check related dependencies
3. Verify configuration
4. Run tests after fixes

## Additional Information
- Environment: ${process.env.NODE_ENV || 'development'}
- Timestamp: ${new Date().toISOString()}
- Component: ${context.action || 'unknown'}
    `;

    const response = await octokit.issues.create({
      owner: process.env.GITHUB_REPOSITORY.split('/')[0],
      repo: process.env.GITHUB_REPOSITORY.split('/')[1],
      title,
      body,
      labels: ['auto-fix', 'bug']
    });

    console.log(`✅ Created issue #${response.data.number}`);
    return response.data.number;
  } catch (error) {
    trackError(error, { action: 'createIssue' });
    console.error('❌ Failed to create issue:', error.message);
    return null;
  }
}

module.exports = {
  createIssue
}; 