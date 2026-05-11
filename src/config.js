const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_DB_PATH = path.resolve(__dirname, '..', 'data', 'demo.db');

function clean(value) {
  return String(value || '').trim();
}

function readPort(value, fallback) {
  const port = Number(value || fallback);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function readDbPath(value) {
  const configuredPath = clean(value);
  if (!configuredPath) {
    return {
      configured: false,
      path: DEFAULT_DB_PATH
    };
  }

  return {
    configured: true,
    path: path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(__dirname, '..', configuredPath)
  };
}

const database = readDbPath(process.env.TGK_DB_PATH);

const config = {
  port: readPort(process.env.PORT, 3000),
  database,
  docusign: {
    oauthBase: clean(process.env.DOCUSIGN_OAUTH_BASE) || 'account-d.docusign.com',
    integrationKey: clean(process.env.DOCUSIGN_INTEGRATION_KEY),
    rsaPrivateKey: clean(process.env.DOCUSIGN_RSA_PRIVATE_KEY)
  },
  maestro: {
    publicBaseUrl: clean(process.env.MAESTRO_PUBLIC_BASE_URL).replace(/\/+$/, ''),
    oauthClientId: clean(process.env.MAESTRO_CLIENT_ID) || 'tgk-maestro-demo-client',
    oauthClientSecret: clean(process.env.MAESTRO_CLIENT_SECRET) || 'tgk-maestro-demo-secret',
    oauthAccessToken: clean(process.env.MAESTRO_ACCESS_TOKEN) || 'tgk-maestro-demo-token',
    publisherName: clean(process.env.MAESTRO_PUBLISHER_NAME) || 'TGK Wealth',
    publisherEmail: clean(process.env.MAESTRO_PUBLISHER_EMAIL) || 'demo@tgkwealth.com',
    publisherPhone: clean(process.env.MAESTRO_PUBLISHER_PHONE) || '800-555-0100'
  }
};

function isDocusignConfigured() {
  return Boolean(config.docusign.integrationKey && config.docusign.rsaPrivateKey);
}

module.exports = {
  config,
  isDocusignConfigured
};
