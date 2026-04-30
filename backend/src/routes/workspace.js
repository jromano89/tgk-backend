const express = require('express');
const crypto = require('crypto');
const { createError, route } = require('../utils');
const { getAccessToken } = require('../docusign-auth');

const router = express.Router();

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

async function createDraftEnvelope({ esignBaseUrl, accountId, accessToken, templateId, templateRoles, status = 'created' }) {
  const response = await fetch(`${esignBaseUrl}/v2.1/accounts/${accountId}/envelopes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      templateId,
      templateRoles,
      status
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`DocuSign envelope creation failed: ${response.status} ${details}`);
  }

  return response.json();
}

async function createWorkspace({ iamBaseUrl, accountId, accessToken, envelopeIds, recipientName, recipientEmail, customerId }) {
  const { firstName, lastName } = splitName(recipientName);
  const workspaceName = `TGK Wealth — ${recipientName}${customerId ? ` [${customerId}]` : ''} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const requestBody = {
    name: workspaceName,
    batch_send: true,
    envelope_ids: envelopeIds,
    upload_requests: [
      {
        name: 'Account Opening Documents',
        description: 'Please upload the required documents for account opening.',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z',
        assignments: [{ first_name: firstName, last_name: lastName, email: recipientEmail }],
        status: 'in_progress'
      }
    ]
  };

  const workspaceUrl = `${iamBaseUrl}/v1/accounts/${accountId}/workspaces`;
  const traceId = crypto.randomBytes(16).toString('hex');
  const parentId = crypto.randomBytes(8).toString('hex');
  const traceparent = `00-${traceId}-${parentId}-01`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'traceparent': traceparent
  };

  console.log('POST', workspaceUrl);
  console.log('Request headers:', JSON.stringify({ ...headers, Authorization: `Bearer ${accessToken.slice(0, 20)}...` }, null, 2));
  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(workspaceUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  const responseText = await response.text();
  console.log('Response status:', response.status);
  console.log('Response body:', responseText);

  if (!response.ok) {
    throw new Error(`DocuSign workspace creation failed: ${response.status} ${responseText}`);
  }

  return JSON.parse(responseText);
}

function getWorkspaceConfig() {
  const accountId = process.env.WORKSPACE_ACCOUNT_ID;
  const userId = process.env.WORKSPACE_ACCOUNT_USERID;
  const esignBaseUrl = (process.env.DOCUSIGN_API_BASE || 'https://demo.docusign.net/restapi').replace(/\/+$/, '');
  const iamBaseUrl = (process.env.DOCUSIGN_IAM_BASE_URL || 'https://api-d.docusign.com').replace(/\/+$/, '');

  if (!accountId || !userId) {
    throw createError(500, 'Workspace account credentials not configured.');
  }

  return { accountId, userId, esignBaseUrl, iamBaseUrl };
}

router.post('/open', route(async (req, res) => {
  const { templateId, recipientName, recipientEmail, customerId, roleName = 'PrimaryOwner' } = req.body || {};

  if (!templateId) throw createError(400, 'Missing templateId');
  if (!recipientName) throw createError(400, 'Missing recipientName');
  if (!recipientEmail) throw createError(400, 'Missing recipientEmail');

  const { accountId, userId, esignBaseUrl, iamBaseUrl } = getWorkspaceConfig();
  const { accessToken } = await getAccessToken(userId, accountId, 'signature aow_manage dtr.rooms.write dtr.rooms.read');

  const envelope = await createDraftEnvelope({
    esignBaseUrl, accountId, accessToken,
    templateId,
    templateRoles: [{ roleName, name: recipientName, email: recipientEmail }]
  });
  const envelopeId = envelope.envelopeId;

  const trustEnvelope = await createDraftEnvelope({
    esignBaseUrl, accountId, accessToken,
    templateId: 'd9f1a8b7-ba8c-4069-a25b-f5852a249b51',
    status: 'sent',
    templateRoles: [
      { roleName: 'grantor', name: recipientName, email: recipientEmail },
      { roleName: 'trustee', name: `Jenny ${splitName(recipientName).lastName}`, email: recipientEmail }
    ]
  });
  const trustEnvelopeId = trustEnvelope.envelopeId;

  const workspace = await createWorkspace({
    iamBaseUrl, accountId, accessToken,
    envelopeIds: [envelopeId, trustEnvelopeId],
    recipientName, recipientEmail, customerId
  });

  res.json({ envelopeId, trustEnvelopeId, workspaceId: workspace.workspace_id });
}));

router.get('/list', route(async (req, res) => {
  const { accountId, userId, iamBaseUrl } = getWorkspaceConfig();
  const { accessToken } = await getAccessToken(userId, accountId, 'signature aow_manage dtr.rooms.write dtr.rooms.read');

  const response = await fetch(`${iamBaseUrl}/v1/accounts/${accountId}/workspaces`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to list workspaces: ${response.status} ${details}`);
  }

  const data = await response.json();
  res.json(data);
}));

router.get('/:workspaceId', route(async (req, res) => {
  const { workspaceId } = req.params;
  const { accountId, userId, iamBaseUrl } = getWorkspaceConfig();
  const { accessToken } = await getAccessToken(userId, accountId, 'signature aow_manage dtr.rooms.write dtr.rooms.read');

  const response = await fetch(`${iamBaseUrl}/v1/accounts/${accountId}/workspaces/${workspaceId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to get workspace: ${response.status} ${details}`);
  }

  const data = await response.json();
  res.json(data);
}));

module.exports = router;
