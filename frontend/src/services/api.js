const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

const defaultOpts = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const request = async (method, path, body = null, extraOpts = {}) => {
  const opts = {
    method,
    ...defaultOpts,
    ...extraOpts,
    headers: { ...defaultOpts.headers, ...(extraOpts.headers || {}) },
  };
  if (body !== null && body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  // For file uploads, remove Content-Type so browser sets multipart boundary
  if (extraOpts.isFormData) {
    delete opts.headers["Content-Type"];
    opts.body = body; // raw FormData
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  return { res, data, ok: res.ok };
};

export const authAPI = {
  login: (body) => request("POST", "/auth/login", body),
  logout: () => request("POST", "/auth/logout"),
  getMe: (signal) =>
    fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include",
      signal,
    }).then(async (res) => ({ res, data: await res.json(), ok: res.ok })),
};

// ─── Participants ─────────────────────────────────────
export const participantAPI = {
  signup: (body) => request("POST", "/participants/signup", body),
  update: (id, body) => request("PUT", `/participants/${id}`, body),
  changePassword: (id, body) =>
    request("PUT", `/participants/${id}/change-password`, body),
};

export const eventAPI = {
  getPublished: () => request("GET", "/events"),
  getById: (eventId) => request("GET", `/events/${eventId}`),
  getOrganizerEvents: (organizerId) =>
    request("GET", `/events/organizer/${organizerId}`),
  create: (organizerId, body) =>
    request("POST", `/events/organizer/${organizerId}/create`, body),
  update: (eventId, body) => request("PATCH", `/events/${eventId}`, body),
  publish: (eventId) => request("POST", `/events/${eventId}/publish`),
};

export const registrationAPI = {
  register: (eventId, body) =>
    request("POST", `/registrations/${eventId}/register`, body),
  getMyRegistrations: () =>
    request("GET", "/registrations/participant/my-registrations"),
  getEventRegistrations: (eventId) =>
    request("GET", `/registrations/${eventId}/registrations`),
  cancel: (registrationId) =>
    request("POST", `/registrations/${registrationId}/cancel`),
  approvePayment: (registrationId) =>
    request("POST", `/registrations/${registrationId}/approve-payment`),
  rejectPayment: (registrationId, body) =>
    request("POST", `/registrations/${registrationId}/reject-payment`, body),
  scanQR: (eventId, body) =>
    request("POST", `/registrations/${eventId}/scan`, body),
  manualAttendance: (registrationId, body) =>
    request("POST", `/registrations/${registrationId}/manual-attendance`, body),
};

export const organizerAPI = {
  getAll: () => request("GET", "/organizers"),
  getById: (id) =>
    request("GET", `/organizers/${id}`),
  follow: (organizerId) =>
    request("POST", `/organizers/${organizerId}/follow`),
  unfollow: (organizerId) =>
    request("POST", `/organizers/${organizerId}/unfollow`),
  getFollowed: () => request("GET", "/organizers/followed/my-organizers"),
  update: (id, body) => request("PUT", `/organizers/${id}`, body),
  requestPasswordReset: (id, body) =>
    request("POST", `/organizers/${id}/request-password-reset`, body),
};

export const adminAPI = {
  createOrganizer: (body) => request("POST", "/admin/create-organizer", body),
  listOrganizers: () => request("GET", "/admin/organizers"),
  updateOrganizerStatus: (id, body) =>
    request("PATCH", `/admin/organizers/${id}/status`, body),
  deleteOrganizer: (id) => request("DELETE", `/admin/organizers/${id}`),
  resetOrganizerPassword: (id) =>
    request("POST", `/admin/organizers/${id}/reset-password`),
  getPasswordResetRequests: () => request("GET", "/admin/password-resets"),
  approvePasswordReset: (id, body) =>
    request("POST", `/admin/password-resets/${id}/approve`, body),
  rejectPasswordReset: (id, body) =>
    request("POST", `/admin/password-resets/${id}/reject`, body),
  getPasswordResetHistory: () =>
    request("GET", "/admin/password-reset-history"),
};


export const discussionAPI = {
  getMessages: (eventId) =>
    request("GET", `/discussions/${eventId}/messages`),
  postMessage: (eventId, body) =>
    request("POST", `/discussions/${eventId}/messages`, body),
  deleteMessage: (messageId) =>
    request("DELETE", `/discussions/messages/${messageId}`),
  togglePin: (messageId) =>
    request("PATCH", `/discussions/messages/${messageId}/pin`),
  react: (messageId, body) =>
    request("POST", `/discussions/messages/${messageId}/react`, body),
};

export const uploadAPI = {
  upload: (formData) =>
    request("POST", "/upload", formData, { isFormData: true }),
};

export const notificationAPI = {
  getUnread: () => request("GET", "/notifications/unread"),
  markAllRead: () => request("POST", "/notifications/mark-read"),
};
