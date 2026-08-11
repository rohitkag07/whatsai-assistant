const root = __dirname;
const ngrokDomain = process.env.NGROK_DOMAIN || 'litigator-perish-graded.ngrok-free.dev';

const common = {
  interpreter: 'node',
  autorestart: true,
  watch: false,
  max_memory_restart: '512M',
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'whatsai-sales-agent',
      cwd: `${root}/agents/xerowa-sales-agent`,
      script: 'index.js',
      interpreter_args: `--env-file=${root}/agents/xerowa-sales-agent/.env`,
      env: {
        TOOL_GATEWAY_URL: 'http://127.0.0.1:8081',
        DYNAMIC_KEYWORD_ENGINE_ENABLED: 'true',
      },
    },
    {
      ...common,
      name: 'whatsai-tool-gateway',
      cwd: `${root}/agents/xerowa-tool-gateway`,
      script: 'index.js',
      interpreter_args: `--env-file=${root}/agents/xerowa-tool-gateway/.env`,
    },
    {
      ...common,
      name: 'whatsai-summoner',
      cwd: `${root}/agents/xerowa-summoner`,
      script: 'index.js',
      interpreter_args: `--env-file=${root}/agents/xerowa-summoner/.env`,
    },
    {
      name: 'whatsai-ngrok',
      cwd: root,
      script: process.env.NGROK_BIN || '/opt/homebrew/bin/ngrok',
      interpreter: 'none',
      args: ['http', `--url=${ngrokDomain}`, '8082'],
      autorestart: true,
      watch: false,
    },
  ],
};
