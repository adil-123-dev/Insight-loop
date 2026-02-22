import api from './api';

// ══════════════════════════════════════════════════════════════════
//  ORGANIZATION SERVICE
//  Connects to backend: /organizations/* routes
//  Backend schema: { id, name, subdomain, created_at }
// ══════════════════════════════════════════════════════════════════

const organizationService = {

  // ─── LIST ALL ORGANIZATIONS ───────────────────────────────────────────────
  // Backend: GET /organizations/
  getOrganizations: async () => {
    const response = await api.get('/organizations/');
    return response.data;
  },

  // ─── GET SINGLE ORGANIZATION ──────────────────────────────────────────────
  // Backend: GET /organizations/{org_id}
  getOrganization: async (orgId) => {
    const response = await api.get(`/organizations/${orgId}`);
    return response.data;
  },

  // ─── CREATE ORGANIZATION (Admin only) ─────────────────────────────────────
  // Backend: POST /organizations/
  // Body: { name, subdomain }
  createOrganization: async (data) => {
    const response = await api.post('/organizations/', data);
    return response.data;
  },

  // ─── DELETE ORGANIZATION (Admin only) ─────────────────────────────────────
  // Backend: DELETE /organizations/{org_id}
  deleteOrganization: async (orgId) => {
    const response = await api.delete(`/organizations/${orgId}`);
    return response.data;
  },

};

export default organizationService;
