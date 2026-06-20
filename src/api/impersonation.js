import { authRequest, startImpersonation as coreStart } from '@aviary-ui/core';

// fetchImpersonationServices returns the services a sysadmin can impersonate a
// user into: [{ key, audience, ui_exchange_url }].
export async function fetchImpersonationServices() {
  const res = await authRequest('/impersonations/services', { method: 'GET' });
  return res?.data ?? [];
}

// startImpersonation mints a one-time handoff code for logging in as targetUserId
// on the given service audience. Returns { code, session_id, audience, expires_at }.
export async function startImpersonation({ targetUserId, audience, reason }) {
  const res = await coreStart({
    target_user_id: targetUserId,
    audience,
    reason: reason || '',
  });
  const data = res?.data ?? res;
  if (!data?.code) throw new Error('Invalid response from server.');
  return data;
}

// launchImpersonation performs the full handoff: mint a code, then open the
// target service UI's exchange page with the code in the URL fragment (never the
// query string) in a new tab. The admin's current tab/session is untouched.
export async function launchImpersonation({ targetUserId, service }) {
  const { code } = await startImpersonation({ targetUserId, audience: service.audience });
  const url = `${service.ui_exchange_url}#code=${encodeURIComponent(code)}`;
  window.open(url, '_blank', 'noopener');
}
