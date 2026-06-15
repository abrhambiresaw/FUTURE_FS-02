const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API call failed');
  }
  return data;
}

// ========== AUTH APIs ==========
export async function login(credentials) {
  return apiCall('/api/auth/login', { 
    method: 'POST', 
    body: JSON.stringify(credentials) 
  });
}

export async function register(userData) {
  return apiCall('/api/auth/register', { 
    method: 'POST', 
    body: JSON.stringify(userData) 
  });
}

export async function getMe() {
  return apiCall('/api/auth/me');
}

export async function forgotPassword(email) {
  return apiCall('/api/auth/forgot-password', { 
    method: 'POST', 
    body: JSON.stringify({ email }) 
  });
}

// ========== CUSTOMER APIs ==========
export async function fetchCustomers() {
  const result = await apiCall('/api/customers');
  return result.data || [];
}

export async function createCustomer(customer) {
  const result = await apiCall('/api/customers', { 
    method: 'POST', 
    body: JSON.stringify(customer) 
  });
  return result.data;
}

export async function updateCustomer(id, customer) {
  const result = await apiCall(`/api/customers/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(customer) 
  });
  return result.data;
}

export async function deleteCustomer(id) {
  return apiCall(`/api/customers/${id}`, { method: 'DELETE' });
}

// ========== TASK APIs ==========
export async function fetchTasks() {
  const result = await apiCall('/api/tasks');
  return result.data || [];
}

export async function createTask(task) {
  const result = await apiCall('/api/tasks', { 
    method: 'POST', 
    body: JSON.stringify(task) 
  });
  return result.data;
}

export async function updateTask(id, task) {
  const result = await apiCall(`/api/tasks/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(task) 
  });
  return result.data;
}

export async function deleteTask(id) {
  return apiCall(`/api/tasks/${id}`, { method: 'DELETE' });
}

// ========== LEAD APIs ==========
export async function fetchLeads() {
  const result = await apiCall('/api/leads');
  return result.data || [];
}

export async function createLead(lead) {
  const result = await apiCall('/api/leads', { 
    method: 'POST', 
    body: JSON.stringify(lead) 
  });
  return result.data;
}

export async function updateLead(id, lead) {
  const result = await apiCall(`/api/leads/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(lead) 
  });
  return result.data;
}

export async function deleteLead(id) {
  return apiCall(`/api/leads/${id}`, { method: 'DELETE' });
}

// ========== DEAL APIs ==========
export async function fetchDeals() {
  const result = await apiCall('/api/deals');
  return result.data || [];
}

export async function createDeal(deal) {
  const result = await apiCall('/api/deals', { 
    method: 'POST', 
    body: JSON.stringify(deal) 
  });
  return result.data;
}

export async function updateDeal(id, deal) {
  const result = await apiCall(`/api/deals/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(deal) 
  });
  return result.data;
}

export async function deleteDeal(id) {
  return apiCall(`/api/deals/${id}`, { method: 'DELETE' });
}

// ========== SYNC ALL DATA ==========
export async function syncAllData() {
  const result = await apiCall('/api/sync-all');
  return result.data;
}