/**
 * GC Function: Update Work Item Status
 *
 * Inputs (event):
 *   event.workitemId  - GC work item ID to update
 *   event.statusId    - target status ID
 *   event.environment - GC region, e.g. "mypurecloud.com" (optional)
 *
 * Environment variables (set in GC Functions config):
 *   GC_CLIENT_ID     - OAuth client credentials client ID
 *   GC_CLIENT_SECRET - OAuth client credentials secret
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
    const { workitemId, statusId } = event;
    const env = event.environment || GC_ENV_DEFAULT;

    const clientId     = process.env.GC_CLIENT_ID;
    const clientSecret = process.env.GC_CLIENT_SECRET;

    if (!workitemId)    return { success: false, error: 'Missing workitemId' };
    if (!statusId)      return { success: false, error: 'Missing statusId' };
    if (!clientId)      return { success: false, error: 'GC_CLIENT_ID env var not set' };
    if (!clientSecret)  return { success: false, error: 'GC_CLIENT_SECRET env var not set' };

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
