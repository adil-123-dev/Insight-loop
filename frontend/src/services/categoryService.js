import api from './api';

// ══════════════════════════════════════════════════════════════════
//  CATEGORY SERVICE
//  Connects to backend: /categories/* routes
//  Backend schema: { id, name, description, organization_id, created_at, updated_at }
// ══════════════════════════════════════════════════════════════════

const categoryService = {

  // ─── LIST ALL CATEGORIES ──────────────────────────────────────────────────
  // Backend: GET /categories/
  getCategories: async (orgId) => {
    const params = orgId ? { organization_id: orgId } : {};
    const response = await api.get('/categories/', { params });
    return response.data;
  },

  // ─── GET SINGLE CATEGORY ──────────────────────────────────────────────────
  // Backend: GET /categories/{category_id}
  getCategory: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  // ─── CREATE CATEGORY (Admin only) ─────────────────────────────────────────
  // Backend: POST /categories/
  // Body: { name, description, organization_id }
  createCategory: async (data) => {
    const response = await api.post('/categories/', data);
    return response.data;
  },

  // ─── DELETE CATEGORY (Admin only) ─────────────────────────────────────────
  // Backend: DELETE /categories/{category_id}
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },

};

export default categoryService;
