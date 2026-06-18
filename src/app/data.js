export const appNavItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Customers', path: '/customers' },
  { label: 'Leads', path: '/leads' },
  { label: 'Deals', path: '/deals' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Settings', path: '/settings' },
]

export const authRoutes = ['/', '/login', '/register', '/forgot-password']
export const leadStages = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
export const dealStages = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

export const revenueSeries = [52, 64, 58, 72, 91, 84, 98, 110, 104, 122, 135, 148]
export const conversionSeries = [22, 24, 27, 30, 28, 32, 35, 37, 41, 43, 46, 49]

export const initialCustomers = [
  { id: 1, name: 'Ava Johnson', company: 'Atlas Studio', email: 'ava@atlasstudio.com', phone: '+1 (415) 555-0132', status: 'Active', lastContact: '2026-06-12' },
  { id: 2, name: 'Ethan Brooks', company: 'Northstar Health', email: 'ethan@northstarhealth.com', phone: '+1 (212) 555-0148', status: 'At Risk', lastContact: '2026-06-10' },
  { id: 3, name: 'Maya Chen', company: 'Luma Finance', email: 'maya@lumafinance.com', phone: '+1 (646) 555-0179', status: 'Active', lastContact: '2026-06-11' },
  { id: 4, name: 'Noah Patel', company: 'Brightline Labs', email: 'noah@brightlinelabs.io', phone: '+1 (303) 555-0188', status: 'Lead', lastContact: '2026-06-13' },
]

export const initialLeads = [
  { id: 'lead-1', name: 'Sophie Grant', company: 'Nova Retail', contact: 'sophie@novaretail.com', value: '$18K', source: 'Website', assigned: 'Nia', stage: 'New Lead' },
  { id: 'lead-2', name: 'Liam Foster', company: 'Cobalt Systems', contact: 'liam@cobaltsystems.com', value: '$42K', source: 'Referral', assigned: 'Alex', stage: 'Contacted' },
  { id: 'lead-3', name: 'Isabella Moore', company: 'Summit AI', contact: 'isabella@summitai.io', value: '$64K', source: 'LinkedIn', assigned: 'Riley', stage: 'Qualified' },
  { id: 'lead-4', name: 'Oliver Reed', company: 'Pinecrest Group', contact: 'oliver@pinecrestgroup.com', value: '$28K', source: 'Event', assigned: 'Nia', stage: 'Proposal Sent' },
  { id: 'lead-5', name: 'Emma Stone', company: 'Peak Logistics', contact: 'emma@peaklogistics.co', value: '$91K', source: 'Outbound', assigned: 'Alex', stage: 'Negotiation' },
]

export const initialDeals = [
  { id: 'deal-1', title: 'Enterprise onboarding', customer: 'Atlas Studio', value: '$32K', closeDate: '2026-06-28', stage: 'Discovery' },
  { id: 'deal-2', title: 'Automation renewal', customer: 'Northstar Health', value: '$54K', closeDate: '2026-07-04', stage: 'Proposal' },
  { id: 'deal-3', title: 'Growth package', customer: 'Brightline Labs', value: '$21K', closeDate: '2026-06-19', stage: 'Negotiation' },
  { id: 'deal-4', title: 'Multi-site rollout', customer: 'Luma Finance', value: '$88K', closeDate: '2026-07-18', stage: 'Closed Won' },
]

export const initialTasks = [
  { id: 'task-1', title: 'Send pricing sheet', description: 'Follow up with Atlas Studio', due: '2026-06-13', priority: 'High', assigned: 'Nia', status: 'Open' },
  { id: 'task-2', title: 'Update pipeline notes', description: 'Capture feedback from demo', due: '2026-06-14', priority: 'Medium', assigned: 'Alex', status: 'In Progress' },
  { id: 'task-3', title: 'Confirm onboarding checklist', description: 'Review kickoff requirements', due: '2026-06-15', priority: 'Low', assigned: 'Riley', status: 'Done' },
]

export const initialSettings = {
  companyName: 'CRM Suite Inc.',
  notificationEmail: 'alerts@crmsuite.com',
  emailAlerts: true,
  inAppNotifications: true,
  taskReminders: true,
  pipelineUpdates: true,
}

export const initialPreferences = {
  theme: 'dark',
  role: 'Admin',
  isAuthenticated: false,
  appearance: 'System',
}

export const recentActivities = [
  { time: '08:42', label: 'Luna Tech moved to Proposal Sent', detail: 'Assigned to Nia Patel' },
  { time: '09:10', label: 'New customer added', detail: 'Atlas Studio imported from web form' },
  { time: '10:25', label: 'Deal closed won', detail: 'Midland Health Enterprise rollout' },
  { time: '11:40', label: 'Task completed', detail: 'Follow-up call with Brightline Labs' },
]

export const upcomingTasks = [
  { title: 'Discovery call with Northstar', due: 'Today · 2:00 PM', priority: 'High' },
  { title: 'Send proposal to Orion', due: 'Today · 4:30 PM', priority: 'Medium' },
  { title: 'Quarterly review prep', due: 'Tomorrow · 10:00 AM', priority: 'Low' },
]

export const notifications = [
  { title: 'New lead from website', detail: 'Sophie Grant requested a demo', type: 'Lead' },
  { title: 'Task due in 2 hours', detail: 'Send pricing sheet to Atlas Studio', type: 'Task' },
  { title: 'Deal stage updated', detail: 'Brightline Labs moved to Negotiation', type: 'Deal' },
]

export const profiles = {
  Admin: { name: 'Abrham', role: 'Admin', email: 'jordan@crmsuite.com' },
  Manager: { name: 'Abrham', role: 'Manager', email: 'mia@crmsuite.com' },
  'Sales Agent': { name: 'Alex Kim', role: 'Sales Agent', email: 'alex@crmsuite.com' },
}

export function normalizePath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/') return '/'
  if (path === '/login') return '/login'
  if (path === '/register') return '/register'
  if (path === '/forgot-password') return '/forgot-password'
  if (path === '/customers' || path === '/leads' || path === '/deals' || path === '/tasks' || path === '/dashboard' || path === '/analytics' || path === '/notifications' || path === '/settings') return path
  if (path.startsWith('/customers/')) return path
  return '/dashboard'
}

export function parseRoute(pathname) {
  const route = normalizePath(pathname)

  if (authRoutes.includes(route)) {
    return { kind: 'auth', page: route === '/' ? 'home' : route.slice(1) }
  }

  if (route.startsWith('/customers/')) {
    return { kind: 'app', page: 'customer-detail', customerId: route.split('/')[2] }
  }

  return { kind: 'app', page: route.slice(1) }
}

export function pathForPage(page, customerId) {
  if (page === 'home') return '/'
  if (page === 'login') return '/login'
  if (page === 'register') return '/register'
  if (page === 'forgot') return '/forgot-password'
  if (page === 'customer-detail') return customerId ? `/customers/${customerId}` : '/customers'
  return `/${page}`
}
