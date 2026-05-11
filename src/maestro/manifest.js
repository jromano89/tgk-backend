const fs = require('fs');
const path = require('path');
const { config: appConfig } = require('../config');

const templatePath = path.join(__dirname, 'manifest', 'clientCredentials.ReadWriteManifest.template.json');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const config = appConfig.maestro;

function buildManifest(publicBaseUrl) {
  const replacements = {
    '__PUBLIC_BASE_URL__': publicBaseUrl,
    '__CLIENT_ID__': config.oauthClientId,
    '__CLIENT_SECRET__': config.oauthClientSecret,
    '__PUBLISHER_NAME__': config.publisherName,
    '__PUBLISHER_EMAIL__': config.publisherEmail,
    '__PUBLISHER_PHONE__': config.publisherPhone
  };

  let content = templateContent;
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.split(placeholder).join(String(value));
  }

  return JSON.parse(content);
}

module.exports = {
  buildManifest
};
