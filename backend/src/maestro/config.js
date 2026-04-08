function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

const config = {
  publicBaseUrl: trimTrailingSlash(process.env.MAESTRO_PUBLIC_BASE_URL || process.env.MAESTRO_EXTENSION_PUBLIC_URL || ''),
  oauthClientId: process.env.MAESTRO_CLIENT_ID || process.env.MAESTRO_EXTENSION_CLIENT_ID || 'tgk-maestro-demo-client',
  oauthClientSecret: process.env.MAESTRO_CLIENT_SECRET || process.env.MAESTRO_EXTENSION_CLIENT_SECRET || 'tgk-maestro-demo-secret',
  oauthAccessToken: process.env.MAESTRO_ACCESS_TOKEN || process.env.MAESTRO_EXTENSION_ACCESS_TOKEN || 'tgk-maestro-demo-token',
  publisherName: process.env.MAESTRO_PUBLISHER_NAME || process.env.MAESTRO_EXTENSION_PUBLISHER_NAME || 'TGK Wealth',
  publisherEmail: process.env.MAESTRO_PUBLISHER_EMAIL || process.env.MAESTRO_EXTENSION_PUBLISHER_EMAIL || 'demo@tgkwealth.com',
  publisherPhone: process.env.MAESTRO_PUBLISHER_PHONE || process.env.MAESTRO_EXTENSION_PUBLISHER_PHONE || '800-555-0100'
};

function resolvePublisherConfig(instanceConfig) {
  const maestro = instanceConfig?.maestro || {};
  return {
    publisherName: maestro.publisherName || config.publisherName,
    publisherEmail: maestro.publisherEmail || config.publisherEmail,
    publisherPhone: maestro.publisherPhone || config.publisherPhone
  };
}

module.exports = {
  config,
  resolvePublisherConfig
};
