import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create separate axios instance for lawyers
const lawyerApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token (for regular users)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for lawyer API
lawyerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lawyerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for lawyer API
lawyerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lawyerToken');
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  getSavedLawyers: () => api.get('/auth/saved-lawyers'),
  addSavedLawyer: (lawyerId) => api.post(`/auth/saved-lawyers/${lawyerId}`),
  removeSavedLawyer: (lawyerId) => api.delete(`/auth/saved-lawyers/${lawyerId}`),
};

// Dashboard API
export const dashboardAPI = {
  getInsights: () => api.get('/dashboard/insights'),
};

// Lawyer API
export const lawyerAPI = {
  register: (lawyerData) => lawyerApi.post('/lawyers/register', lawyerData),
  login: (credentials) => lawyerApi.post('/lawyers/login', credentials),
  getMe: () => lawyerApi.get('/lawyers/me'),
  updateProfile: (profileData) => lawyerApi.put('/lawyers/profile', profileData),
  getStats: () => lawyerApi.get('/lawyers/stats'),
  getApprovedLawyers: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.state) params.append('state', filters.state);
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.search) params.append('search', filters.search);
    return lawyerApi.get(`/lawyers/approved?${params.toString()}`);
  },
  getLawyerById: (lawyerId) => lawyerApi.get(`/consultations/lawyer/${lawyerId}`),
  getPendingLawyers: () => api.get('/lawyers/pending'),
  updateLawyerStatus: (lawyerId, status, rejectionReason = '') => 
    api.put(`/lawyers/${lawyerId}/status`, { status, rejectionReason }),
};

// Consultation API
export const consultationAPI = {
  createConsultation: (consultationData) => api.post('/consultations', consultationData),
  getUserConsultations: () => api.get('/consultations/user'),
  getLawyerConsultations: (status) => {
    const params = status ? `?status=${status}` : '';
    return lawyerApi.get(`/consultations/lawyer${params}`);
  },
  updateConsultationStatus: (consultationId, status, lawyerResponse) => 
    lawyerApi.put(`/consultations/${consultationId}/status`, { status, lawyerResponse }),
  addRating: (consultationId, rating, review) => 
    api.post(`/consultations/${consultationId}/rating`, { rating, review }),
  cancelConsultation: (consultationId) => api.put(`/consultations/${consultationId}/cancel`),
  getLawyerById: (lawyerId) => api.get(`/consultations/lawyer/${lawyerId}`),
};

// Chat API (use user token via api, or lawyer token via lawyerApi – pass isLawyer)
export const chatAPI = {
  getMessages: (consultationId, isLawyer) =>
    (isLawyer ? lawyerApi : api).get(`/consultations/${consultationId}/messages`),
  sendMessage: (consultationId, content, isLawyer) =>
    (isLawyer ? lawyerApi : api).post(`/consultations/${consultationId}/messages`, { content }),
};

// Admin API (requires admin auth)
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  getAllLawyers: () => api.get('/admin/lawyers'),
  updateUserStatus: (userId, isSuspended) =>
    api.put(`/admin/users/${userId}/status`, { isSuspended }),
  updateLawyerSuspension: (lawyerId, isSuspended) =>
    api.put(`/admin/lawyers/${lawyerId}/suspend`, { isSuspended }),
  getReports: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/admin/reports${search ? `?${search}` : ''}`);
  },
  resolveReport: (reportId, action, adminNotes) =>
    api.put(`/admin/reports/${reportId}/resolve`, { action, adminNotes }),
};

// Report API (user reports lawyer or user)
export const reportAPI = {
  reportLawyer: (lawyerId, reason, description) =>
    api.post('/reports/lawyer', { lawyerId, reason, description: description || '' }),
  reportUser: (userId, reason, description) =>
    api.post('/reports/user', { userId, reason, description: description || '' }),
};

// Resources API (public – legal helplines and links)
export const resourcesAPI = {
  getResources: () => api.get('/resources'),
};

// Articles API (Legal Knowledge Base – Know Your Rights)
export const articlesAPI = {
  getArticles: (params = {}) => {
    const search = new URLSearchParams();
    if (params.category) search.append('category', params.category);
    if (params.language) search.append('language', params.language);
    const q = search.toString();
    return api.get(`/articles${q ? `?${q}` : ''}`);
  },
  getArticleById: (id) => api.get(`/articles/${id}`),
  incrementReadCount: (id) => api.post(`/articles/${id}/read`),
  like: (id) => api.post(`/articles/${id}/like`),
  dislike: (id) => api.post(`/articles/${id}/dislike`),
  createArticle: (data) => api.post('/articles', data),
  updateArticle: (id, data) => api.put(`/articles/${id}`, data),
  deleteArticle: (id) => api.delete(`/articles/${id}`),
};

// Feedback & Ratings API
export const feedbackAPI = {
  createFeedback: (payload) => api.post('/feedback', payload),
  getMyFeedback: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/feedback/my${search ? `?${search}` : ''}`);
  },
  updateMyFeedback: (feedbackId, payload) => api.put(`/feedback/my/${feedbackId}`, payload),
  deleteMyFeedback: (feedbackId) => api.delete(`/feedback/my/${feedbackId}`),
  getLawyerPublicSummary: (lawyerId) => api.get(`/feedback/lawyer/${lawyerId}/summary`),
  getMyLawyerPerformance: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return lawyerApi.get(`/feedback/lawyer/me/performance${search ? `?${search}` : ''}`);
  },
  getPlatformAnalytics: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/feedback/analytics/platform${search ? `?${search}` : ''}`);
  },
  getLawyerPerformanceAnalytics: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/feedback/analytics/lawyers${search ? `?${search}` : ''}`);
  },
  getSatisfactionMetrics: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/feedback/analytics/satisfaction${search ? `?${search}` : ''}`);
  },
  generateReport: (payload) => api.post('/feedback/reports/generate', payload),
  listReports: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/feedback/reports${search ? `?${search}` : ''}`);
  },
  getLatestReport: (periodType) => api.get(`/feedback/reports/latest/${periodType}`),
};

// Community Support API
export const communityAPI = {
  listPosts: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/community/posts${search ? `?${search}` : ''}`);
  },
  getPostById: (postId, params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/community/posts/${postId}${search ? `?${search}` : ''}`);
  },
  listPostComments: (postId, params = {}) => {
    const search = new URLSearchParams(params).toString();
    return api.get(`/community/posts/${postId}/comments${search ? `?${search}` : ''}`);
  },
  createPost: (payload) => api.post('/community/posts', payload),
  deletePost: (postId) => api.delete(`/community/posts/${postId}`),
  createComment: (postId, payload) => api.post(`/community/posts/${postId}/comments`, payload),
  deleteComment: (commentId) => api.delete(`/community/comments/${commentId}`),
  reactToPost: (postId, reactionType) => api.post(`/community/posts/${postId}/reactions`, { reactionType }),
  reactToComment: (commentId, reactionType) => api.post(`/community/comments/${commentId}/reactions`, { reactionType }),
};

// Gemini API (keeping existing functions but updating to include links)
export const fetchGroundedResponse = async (userQuery, user, language) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const targetLanguage = language === 'hi' ? 'Hindi' : 'English';

  const systemPrompt = `You are 'Shakti-Setu', a helpful legal assistant for women in India. Provide information based on Indian law. Your tone is supportive, clear, and empowering. 
  
  *** CRITICAL INSTRUCTION ***
   INSTRUCTIONS:
  1. Answer in ${targetLanguage}.
  2. Format your response clearly.
  3. Use separate paragraphs for different parts of the answer.
  4. If explaining a process, use numbered steps (1., 2., 3.) on new lines.
  5. Use bullet points for lists.
  6. Provide legal info, not advice.

  You MUST answer in ${targetLanguage}. The user's query may be in a different language, but your response must be in ${targetLanguage}.
  
  You are speaking to: ${user?.name || 'a user'}${user?.age ? `, aged ${user.age}` : ''}${user?.state ? `, from ${user.state}` : ''}.
  You MUST tailor your legal information to be relevant to their age and state (e.g., laws specific to ${user?.state || 'their state'}).
  
  The user may ask about their rights, how to do something (like get a voter ID card), or current affairs related to law.
  Use the provided Google Search tool to find relevant, up-to-date information and links to answer the query.
  If you find a relevant official link (like a government website for a voter ID card), YOU MUST include it in your response.
  
  IMPORTANT: You are providing legal INFORMATION, not legal ADVICE. 
  You MUST always conclude your answer by recommending that the user consults a qualified lawyer for advice specific to their situation.`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      const text = candidate.content.parts[0].text;
      
      let sources = [];
      const groundingMetadata = candidate.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
        sources = groundingMetadata.groundingAttributions
          .map(attr => attr.web)
          .filter(web => web && web.uri && web.title);
      }
      
      return { text, sources };
    } else {
      throw new Error("Invalid response structure from API.");
    }
  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    throw error;
  }
};

// Fetch Demographic Insights with article links
export const fetchDemographicInsights = async (age, state) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const prompt = `
    Generate a JSON object for a female user, Age: ${age}, State: ${state}, India.
    The JSON must have exactly two keys: "problems" and "rights".
    
    1. "problems": An array of 10 common legal/social issues faced by women of this age in this state. 
       Each item must be an object with:
       - "en" (English text)
       - "hi" (Hindi translation)
       - "link" (a relevant article URL about this problem - use official government websites like wcd.nic.in, nalsa.gov.in, or other legal aid websites)
    
    2. "rights": An array of 10 legal rights relevant to these problems. 
       Each item must be an object with:
       - "en" (English text)
       - "hi" (Hindi translation)
       - "link" (a relevant article URL about this right - use official government websites like wcd.nic.in, nalsa.gov.in, or other legal aid websites)
    
    Important: Provide real, working URLs. Use these base URLs as examples:
    - https://wcd.nic.in/ (Ministry of Women and Child Development)
    - https://nalsa.gov.in/ (National Legal Services Authority)
    - https://www.mha.gov.in/ (Ministry of Home Affairs)
    - State-specific women's commission websites
    
    Return ONLY the JSON object. No markdown formatting, no code blocks, just pure JSON.
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response text from API");
    }
    
    // Clean the response (remove markdown code blocks if present)
    let cleanedText = text.trim();
    // Remove markdown code blocks if they exist
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate structure
    if (!parsed.problems || !parsed.rights) {
      throw new Error("Invalid response structure");
    }
    
    // Ensure all items have links (add fallback if missing)
    parsed.problems = parsed.problems.map((item, idx) => ({
      ...item,
      link: item.link || `https://wcd.nic.in/`
    }));
    
    parsed.rights = parsed.rights.map((item, idx) => ({
      ...item,
      link: item.link || `https://nalsa.gov.in/`
    }));
    
    return parsed;
  } catch (error) {
    console.error("Dashboard API Error:", error);
    // Fallback data with example links
    return {
      problems: Array(10).fill(null).map((_, idx) => ({
        en: `Legal challenge ${idx + 1} for women in ${state}`,
        hi: `${state} में महिलाओं के लिए कानूनी चुनौती ${idx + 1}`,
        link: "https://wcd.nic.in/"
      })),
      rights: Array(10).fill(null).map((_, idx) => ({
        en: `Legal right ${idx + 1} for women`,
        hi: `महिलाओं के लिए कानूनी अधिकार ${idx + 1}`,
        link: "https://nalsa.gov.in/"
      }))
    };
  }
};

export default api;
