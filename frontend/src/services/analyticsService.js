import api from './api';

// ══════════════════════════════════════════════════════════════════
//  ANALYTICS SERVICE
//  Connects to backend: /forms/{form_id}/analytics/* routes
//  Access: Instructor/Admin only
// ══════════════════════════════════════════════════════════════════

const analyticsService = {

  // ─── SUMMARY STATISTICS ───────────────────────────────────────────────────
  // Backend: GET /forms/{form_id}/analytics/summary
  // Returns: { total_responses, completion_rate, avg_rating,
  //            anonymous_count, identified_count, response_by_date }
  getSummary: async (formId) => {
    const response = await api.get(`/forms/${formId}/analytics/summary`);
    return response.data;
  },

  // ─── QUESTION ANALYTICS ───────────────────────────────────────────────────
  // Backend: GET /forms/{form_id}/analytics/question/{question_id}
  // Returns: Per-question breakdown (avg rating, answer distribution, etc.)
  getQuestionAnalytics: async (formId, questionId) => {
    const response = await api.get(`/forms/${formId}/analytics/question/${questionId}`);
    return response.data;
  },

  // ─── TRENDS OVER TIME ─────────────────────────────────────────────────────
  // Backend: GET /forms/{form_id}/analytics/trends
  // Returns: Response count over time (for line charts)
  getTrends: async (formId) => {
    const response = await api.get(`/forms/${formId}/analytics/trends`);
    return response.data;
  },

  // ─── SENTIMENT ANALYSIS ───────────────────────────────────────────────────
  // Backend: GET /forms/{form_id}/analytics/sentiment
  // Returns: Positive / Neutral / Negative breakdown on text answers
  getSentiment: async (formId) => {
    const response = await api.get(`/forms/${formId}/analytics/sentiment`);
    return response.data;
  },

  // ─── EXPORT FULL REPORT ───────────────────────────────────────────────────
  // Backend: GET /forms/{form_id}/analytics/export
  // Returns: Complete report with all analytics data
  exportReport: async (formId) => {
    const response = await api.get(`/forms/${formId}/analytics/export`);
    return response.data;
  },

};

export default analyticsService;
