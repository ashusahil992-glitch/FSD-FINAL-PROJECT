import api from './api.js';

export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}

export async function fetchAdminUsers() {
  const { data } = await api.get('/admin/users');
  return data.data;
}

export async function fetchAdminListings() {
  const { data } = await api.get('/admin/listings');
  return data.data;
}

export async function fetchAdminReports() {
  const { data } = await api.get('/admin/reports');
  return data.data;
}

export async function fetchAdminVerifications(status) {
  const { data } = await api.get('/admin/verifications', { params: status ? { status } : {} });
  return data.data;
}

export async function fetchAdminVerificationHistory(studentId) {
  const { data } = await api.get(`/admin/verifications/${studentId}/history`);
  return data.data;
}

export async function fetchAdminVerificationDocument(requestId) {
  const { data, headers } = await api.get(`/admin/verifications/${requestId}/document`, { responseType: 'blob' });
  return { blob: new Blob([data], { type: headers['content-type'] }), contentType: headers['content-type'] };
}

export async function reviewAdminVerification(requestId, status, rejectionReason) {
  const { data } = await api.patch(`/admin/verifications/${requestId}`, { status, rejectionReason });
  return data.data;
}

export async function suspendUser(userId) {
  const { data } = await api.patch(`/admin/users/${userId}/suspend`);
  return data.data;
}

export async function reinstateUser(userId) {
  const { data } = await api.patch(`/admin/users/${userId}/reinstate`);
  return data.data;
}

export async function moderateListing(listingId, status) {
  const { data } = await api.patch(`/admin/listings/${listingId}/moderation`, { status });
  return data.data;
}

export async function reviewReport(reportId, status) {
  const { data } = await api.patch(`/admin/reports/${reportId}`, { status });
  return data.data;
}
