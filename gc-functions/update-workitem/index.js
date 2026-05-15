/**
 * GC Function: Update Work Item Status
 *
 * Inputs (via Data Action requestTemplate):
 *   event.workitemId  - GC work item ID to update
 *   event.statusId    - target status ID
 *   event.clientId    - OAuth client credentials ID (stored in Data Action config, not in source)
 *   event.clientSecret - OAuth client credentials secret (stored in Data Action config, not in source)
 *   event.environment - GC region, e.g. "mypurecloud.com" (optional, defaults below)
 *
 * Returns: { success, workitemId, statusId } or { success: false, error }
 */

const GC_ENV_DEFAULT = 'mypurecloud.com';

async function getToken(clientId, clientSecret, env) {
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`https://login.${env}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token request failed ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function patchWorkitem(workitemId, statusId, token, env) {
  const res = await fetch(`https://api.${env}/api/v2/taskmanagement/workitems/${workitemId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statusId })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Workitem PATCH failed ${res.status}: ${body}`);
  }
  return await res.json();
}

exports.handler = async (event) => {
  try {
    const { workitemId, statusId, clientId, clientSecret } = event;
    const env = event.environment || GC_ENV_DEFAULT;

    if (!workitemId) return { success: false, error: 'Missing workitemId' };
    if (!statusId)   return { success: false, error: 'Missing statusId' };
    if (!clientId)   return { success: false, error: 'Missing clientId' };
    if (!clientSecret) return { success: false, error: 'Missing clientSecret' };

    const token  = await getToken(clientId, clientSecret, env);
    const result = await patchWorkitem(workitemId, statusId, token, env);

    return {
      success: true,
      workitemId: result.id,
      statusId: result.statusId
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
