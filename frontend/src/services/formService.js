import api from './api';

// ══════════════════════════════════════════════════════════════════
//  FORM SERVICE
//  Connects to backend: /forms/* routes
// ══════════════════════════════════════════════════════════════════

const formService = {

  // ─── GET ALL FORMS ────────────────────────────────────────────────────────
  // Backend: GET /forms/
  // Returns: List of forms (filtered by role automatically on backend)
  getForms: async () => {
    const response = await api.get('/forms/');
    return response.data;
  },

  // ─── GET SINGLE FORM ──────────────────────────────────────────────────────
  // Backend: GET /forms/{form_id}
  // Returns: Form with full details
  getForm: async (formId) => {
    const response = await api.get(`/forms/${formId}`);
    return response.data;
  },

  // ─── CREATE FORM ──────────────────────────────────────────────────────────
  // Backend: POST /forms/  (Instructor/Admin only)
  // Body: { title, description, course_name, course_code, open_date, close_date }
  createForm: async (formData) => {
    const response = await api.post('/forms/', formData);
    return response.data;
  },

  // ─── UPDATE FORM ──────────────────────────────────────────────────────────
  // Backend: PUT /forms/{form_id}  (Instructor/Admin only)
  // Body: any subset of form fields
  updateForm: async (formId, formData) => {
    const response = await api.put(`/forms/${formId}`, formData);
    return response.data;
  },

  // ─── DELETE FORM ──────────────────────────────────────────────────────────
  // Backend: DELETE /forms/{form_id}  (Instructor/Admin only)
  deleteForm: async (formId) => {
    const response = await api.delete(`/forms/${formId}`);
    return response.data;
  },

  // ─── CHANGE FORM STATUS ───────────────────────────────────────────────────
  // Backend: PATCH /forms/{form_id}/status
  // Body: { status: "draft" | "published" | "closed" }
  updateFormStatus: async (formId, status) => {
    const response = await api.patch(`/forms/${formId}/status`, { status });
    return response.data;
  },

  // ══════════════════════════════════════════════════════════════════
  //  QUESTIONS — nested under forms
  //  Connects to backend: /forms/{form_id}/questions/* and /questions/*
  // ══════════════════════════════════════════════════════════════════

  // ─── GET QUESTIONS FOR A FORM ─────────────────────────────────────────────
  // Backend: GET /forms/{form_id}/questions/
  getQuestions: async (formId) => {
    const response = await api.get(`/forms/${formId}/questions/`);
    return response.data;
  },

  // ─── ADD QUESTION TO FORM ─────────────────────────────────────────────────
  // Backend: POST /forms/{form_id}/questions/  (Instructor/Admin only)
  // Body: { question_text, question_type, is_required, options }
  // question_type: "rating" | "text" | "mcq" | "yes_no"
  addQuestion: async (formId, questionData) => {
    const response = await api.post(`/forms/${formId}/questions/`, questionData);
    return response.data;
  },

  // ─── UPDATE QUESTION ──────────────────────────────────────────────────────
  // Backend: PUT /questions/{question_id}
  updateQuestion: async (questionId, questionData) => {
    const response = await api.put(`/questions/${questionId}`, questionData);
    return response.data;
  },

  // ─── DELETE QUESTION ──────────────────────────────────────────────────────
  // Backend: DELETE /questions/{question_id}
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/questions/${questionId}`);
    return response.data;
  },

  // ─── REORDER QUESTIONS ────────────────────────────────────────────────────
  // Backend: PATCH /questions/reorder
  // Body: [{ question_id, new_order }, ...]
  reorderQuestions: async (reorderData) => {
    const response = await api.patch('/questions/reorder', reorderData);
    return response.data;
  },

  // ══════════════════════════════════════════════════════════════════
  //  RESPONSES — student feedback submissions
  //  Connects to backend: /forms/{form_id}/responses/*
  // ══════════════════════════════════════════════════════════════════

  // ─── SUBMIT FEEDBACK RESPONSE (Student) ───────────────────────────────────
  // Backend: POST /forms/{form_id}/responses/
  // Body: { is_anonymous, answers: [{ question_id, answer_value }] }
  submitResponse: async (formId, responseData) => {
    const response = await api.post(`/forms/${formId}/responses/`, responseData);
    return response.data;
  },

  // ─── GET ALL RESPONSES FOR A FORM (Instructor/Admin) ─────────────────────
  // Backend: GET /forms/{form_id}/responses/
  getResponses: async (formId) => {
    const response = await api.get(`/forms/${formId}/responses/`);
    return response.data;
  },

  // ─── GET SINGLE RESPONSE DETAIL ───────────────────────────────────────────
  // Backend: GET /responses/{response_id}
  getResponse: async (responseId) => {
    const response = await api.get(`/responses/${responseId}`);
    return response.data;
  },

};

export default formService;
