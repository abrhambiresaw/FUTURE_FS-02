import { useEffect, useMemo, useState } from "react";
import {
  authRoutes,
  conversionSeries,
  dealStages,
  initialCustomers,
  initialDeals,
  initialLeads,
  initialPreferences,
  initialSettings,
  initialTasks,
  leadStages,
  normalizePath,
  notifications,
  parseRoute,
  pathForPage,
  profiles,
  revenueSeries,
} from "./data";
import { renderAppShell } from "./pages/AppPages";
import { renderAuthPage } from "./pages/crmPages";
import "../App.css";

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeJsonParse(window.localStorage.getItem(key), fallback);
}

function CRMApp() {
  const defaultEmail = profiles[initialPreferences.role].email;
  const [preferences, setPreferences] = useState(() => ({
    ...readStorage("crm-suite-preferences", initialPreferences),
    isAuthenticated: false,
  }));
  const [data, setData] = useState(() =>
    readStorage("crm-suite-data", {
      customers: initialCustomers,
      leads: initialLeads,
      deals: initialDeals,
      tasks: initialTasks,
      settings: initialSettings,
      selectedCustomerId: initialCustomers[0]?.id,
    })
  );
  const [route, setRoute] = useState(() =>
    typeof window === "undefined" ? "/" : normalizePath(window.location.pathname)
  );
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [modal, setModal] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authDrafts, setAuthDrafts] = useState(() => ({
    login: { email: defaultEmail, password: "demo123" },
    register: {
      name: "Taylor Morgan",
      email: "taylor@company.com",
      company: "Acme Growth Partners",
      password: "",
    },
    forgot: { email: defaultEmail },
  }));

  // Demo users for login
  const demoUsers = [
    { email: "jordan@crmsuite.com", password: "demo123", name: "Jordan Lee", role: "Admin" },
    { email: "mia@crmsuite.com", password: "demo123", name: "Mia Carter", role: "Manager" },
    { email: "alex@crmsuite.com", password: "demo123", name: "Alex Kim", role: "Sales Agent" },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);

  useEffect(() => {
    window.localStorage.setItem("crm-suite-preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    window.localStorage.setItem("crm-suite-data", JSON.stringify(data));
  }, [data]);

  // Prevent horizontal scrolling
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
    };
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function replaceRoute(path) {
    window.history.replaceState({}, "", path);
    setRoute(path);
  }

  useEffect(() => {
    let redirectPath = "";
    if (!preferences.isAuthenticated && !authRoutes.includes(route)) {
      redirectPath = "/";
    }
    if (preferences.isAuthenticated && authRoutes.includes(route)) {
      redirectPath = "/dashboard";
    }
    if (!redirectPath) return;
    const timer = window.setTimeout(() => replaceRoute(redirectPath), 0);
    return () => window.clearTimeout(timer);
  }, [preferences.isAuthenticated, route]);

  const currentRoute = parseRoute(route);
  const currentProfile = profiles[preferences.role];
  const canAccessSettings = preferences.role === "Admin" || preferences.role === "Manager";

  const visibleCustomers = useMemo(() => {
    const term = search.toLowerCase();
    return data.customers.filter((customer) =>
      [customer.name, customer.company, customer.email, customer.status].some(
        (value) => value?.toLowerCase().includes(term)
      )
    );
  }, [data.customers, search]);

  const visibleLeads = useMemo(() => {
    const term = search.toLowerCase();
    return data.leads.filter((lead) =>
      [lead.name, lead.company, lead.stage, lead.assigned, lead.source].some(
        (value) => value?.toLowerCase().includes(term)
      )
    );
  }, [data.leads, search]);

  const visibleDeals = useMemo(() => {
    const term = search.toLowerCase();
    return data.deals.filter((deal) =>
      [deal.title, deal.customer, deal.stage].some((value) =>
        value?.toLowerCase().includes(term)
      )
    );
  }, [data.deals, search]);

  const visibleTasks = useMemo(() => {
    const term = search.toLowerCase();
    return data.tasks.filter((task) =>
      [task.title, task.description, task.assigned, task.status, task.priority].some(
        (value) => value?.toLowerCase().includes(term)
      )
    );
  }, [data.tasks, search]);

  const groupedLeads = useMemo(
    () => leadStages.map((stage) => ({ stage, items: visibleLeads.filter((lead) => lead.stage === stage) })),
    [visibleLeads]
  );
  
  const groupedDeals = useMemo(
    () => dealStages.map((stage) => ({ stage, items: visibleDeals.filter((deal) => deal.stage === stage) })),
    [visibleDeals]
  );
  
  const analytics = useMemo(
    () => ({
      monthlyRevenue: revenueSeries,
      conversionRate: conversionSeries,
      customerGrowth: [10, 18, 22, 30, 29, 36, 42, 48, 53, 60, 68, 76],
      performance: [82, 88, 77, 93, 86],
    }),
    []
  );

  const filteredNotifications = useMemo(() => {
    const term = search.toLowerCase();
    return notifications.filter((item) =>
      [item.title, item.detail, item.type].some((value) => value.toLowerCase().includes(term))
    );
  }, [search]);

  const selectedCustomer = useMemo(
    () => data.customers.find((customer) => String(customer.id) === String(data.selectedCustomerId)) ?? data.customers[0],
    [data.customers, data.selectedCustomerId]
  );

  function navigate(path, replace = false) {
    const nextPath = normalizePath(path);
    if (replace) window.history.replaceState({}, "", nextPath);
    else window.history.pushState({}, "", nextPath);
    setRoute(nextPath);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setModal(null);
  }

  function openModal(entity, mode, record = null) {
    console.log("Opening modal:", { entity, mode, record });
    setModal({ entity, mode, record });
  }

  function closeModal() {
    setModal(null);
  }

  function signOut() {
    setPreferences((current) => ({ ...current, isAuthenticated: false }));
    navigate("/", true);
  }

  function updateAuthDraft(page, field, value) {
    setAuthDrafts((current) => ({
      ...current,
      [page]: { ...current[page], [field]: value },
    }));
  }

  async function submitAuth(page) {
    const draft = authDrafts[page];
    const email = String(draft.email ?? "").trim();
    const password = String(draft.password ?? "");
    
    setAuthBusy(true);
    setAuthMessage("");

    try {
      if (page === "login") {
        // Check against demo users
        const user = demoUsers.find(u => u.email === email && u.password === password);
        if (!user) {
          throw new Error("Invalid email or password. Try: jordan@crmsuite.com / demo123");
        }
        
        setPreferences((current) => ({
          ...current,
          isAuthenticated: true,
          role: user.role,
        }));
        setAuthMessage("Signed in successfully.");
        navigate("/dashboard", true);
        return;
      }
      
      if (page === "register") {
        const name = String(draft.name ?? "").trim();
        const company = String(draft.company ?? "").trim();
        
        if (!name) throw new Error("Full name is required.");
        if (!company) throw new Error("Company name is required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        
        // Auto-login after registration
        setPreferences((current) => ({
          ...current,
          isAuthenticated: true,
          role: "Manager",
        }));
        setAuthMessage("Account created successfully!");
        navigate("/dashboard", true);
        return;
      }
      
      if (page === "forgot") {
        setAuthMessage(`Password reset link sent to ${email}`);
        return;
      }
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  // ========== CRUD OPERATIONS (Local Storage) ==========
  
  function createCustomerRecord(fields) {
    const newCustomer = {
      id: Date.now(),
      name: fields.name,
      company: fields.company,
      email: fields.email,
      phone: fields.phone || "",
      status: fields.status || "Lead",
      lastContact: fields.lastContact || new Date().toISOString().split('T')[0],
    };
    setData((current) => ({
      ...current,
      customers: [newCustomer, ...current.customers],
      selectedCustomerId: newCustomer.id,
    }));
    navigate(`/customers/${newCustomer.id}`, true);
    return true;
  }

  function updateCustomerRecord(record, fields) {
    setData((current) => ({
      ...current,
      customers: current.customers.map((c) =>
        String(c.id) === String(record.id) ? { ...c, ...fields } : c
      ),
    }));
    return true;
  }

  function deleteCustomerRecord(record) {
    setData((current) => {
      const next = { ...current };
      next.customers = current.customers.filter((item) => String(item.id) !== String(record.id));
      if (String(current.selectedCustomerId) === String(record.id)) {
        next.selectedCustomerId = next.customers[0]?.id ?? null;
      }
      return next;
    });
    if (currentRoute.page === "customer-detail" && String(currentRoute.customerId) === String(record.id)) {
      navigate("/customers", true);
    }
    return true;
  }

  function createTaskRecord(fields) {
    const newTask = {
      id: `task-${Date.now()}`,
      title: fields.title,
      description: fields.description || "",
      due: fields.due || "",
      priority: fields.priority || "Medium",
      assigned: fields.assigned || "",
      status: fields.status || "Open",
    };
    setData((current) => ({
      ...current,
      tasks: [newTask, ...current.tasks],
    }));
    return true;
  }

  function updateTaskRecord(record, fields) {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((t) =>
        String(t.id) === String(record.id) ? { ...t, ...fields } : t
      ),
    }));
    return true;
  }

  function deleteTaskRecord(record) {
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter((item) => String(item.id) !== String(record.id)),
    }));
    return true;
  }

  function createLeadRecord(fields) {
    const newLead = {
      id: `lead-${Date.now()}`,
      name: fields.name,
      company: fields.company,
      contact: fields.contact || "",
      value: fields.value || "",
      source: fields.source || "",
      assigned: fields.assigned || "",
      stage: fields.stage || "New Lead",
    };
    setData((current) => ({
      ...current,
      leads: [newLead, ...current.leads],
    }));
    return true;
  }

  function updateLeadRecord(record, fields) {
    setData((current) => ({
      ...current,
      leads: current.leads.map((l) =>
        String(l.id) === String(record.id) ? { ...l, ...fields } : l
      ),
    }));
    return true;
  }

  function deleteLeadRecord(record) {
    setData((current) => ({
      ...current,
      leads: current.leads.filter((item) => String(item.id) !== String(record.id)),
    }));
    return true;
  }

  function createDealRecord(fields) {
    const newDeal = {
      id: `deal-${Date.now()}`,
      title: fields.title,
      customer: fields.customer,
      value: fields.value || "",
      closeDate: fields.closeDate || "",
      stage: fields.stage || "Discovery",
    };
    setData((current) => ({
      ...current,
      deals: [newDeal, ...current.deals],
    }));
    return true;
  }

  function updateDealRecord(record, fields) {
    setData((current) => ({
      ...current,
      deals: current.deals.map((d) =>
        String(d.id) === String(record.id) ? { ...d, ...fields } : d
      ),
    }));
    return true;
  }

  function deleteDealRecord(record) {
    setData((current) => ({
      ...current,
      deals: current.deals.filter((item) => String(item.id) !== String(record.id)),
    }));
    return true;
  }

  function updateSettings(fields) {
    setData((current) => ({
      ...current,
      settings: { ...current.settings, ...fields },
    }));
  }

  function moveLeadToStage(targetStage, leadId) {
    const lead = data.leads.find(l => String(l.id) === String(leadId));
    if (lead) {
      updateLeadRecord(lead, { ...lead, stage: targetStage });
    }
  }

  function moveDealToStage(targetStage, dealId) {
    const deal = data.deals.find(d => String(d.id) === String(dealId));
    if (deal) {
      updateDealRecord(deal, { ...deal, stage: targetStage });
    }
  }

  function handleDragStart(item) {
    setDraggedItem(item);
  }

  function handleDrop(targetStage) {
    if (draggedItem?.type === "lead") {
      moveLeadToStage(targetStage, draggedItem.id);
    }
    if (draggedItem?.type === "deal") {
      moveDealToStage(targetStage, draggedItem.id);
    }
    setDraggedItem(null);
  }

  function handleModalSubmit(event) {
    event.preventDefault();
    if (!modal) return;
    
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    
    if (modal.mode === "delete") {
      if (modal.entity === "customer") deleteCustomerRecord(modal.record);
      if (modal.entity === "task") deleteTaskRecord(modal.record);
      if (modal.entity === "lead") deleteLeadRecord(modal.record);
      if (modal.entity === "deal") deleteDealRecord(modal.record);
      closeModal();
      return;
    }
    
    if (modal.entity === "customer") {
      if (modal.mode === "edit") updateCustomerRecord(modal.record, values);
      else createCustomerRecord(values);
    }
    if (modal.entity === "task") {
      if (modal.mode === "edit") updateTaskRecord(modal.record, values);
      else createTaskRecord(values);
    }
    if (modal.entity === "lead") {
      if (modal.mode === "edit") updateLeadRecord(modal.record, values);
      else createLeadRecord(values);
    }
    if (modal.entity === "deal") {
      if (modal.mode === "edit") updateDealRecord(modal.record, values);
      else createDealRecord(values);
    }
    if (modal.entity === "settings") {
      updateSettings(values);
    }
    
    closeModal();
  }

  function handleUpdateTaskDone(task) {
    updateTaskRecord(task, { ...task, status: "Done" });
  }

  function renderAuth() {
    const authPage = currentRoute.page === "register" ? "register" : currentRoute.page === "forgot-password" ? "forgot" : currentRoute.page === "login" ? "login" : "home";
    return renderAuthPage({
      page: authPage,
      preferences,
      profiles,
      analytics,
      authDrafts,
      authMessage,
      authBusy,
      onNavigate: (page) => navigate(pathForPage(page), true),
      onAuthChange: updateAuthDraft,
      onAuthSubmit: submitAuth,
      onToggleTheme: () => setPreferences((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" })),
      onCycleRole: () => setPreferences((current) => {
        const nextRole = current.role === "Admin" ? "Manager" : current.role === "Manager" ? "Sales Agent" : "Admin";
        setAuthDrafts((drafts) => ({
          ...drafts,
          login: { ...drafts.login, email: profiles[nextRole].email },
          forgot: { ...drafts.forgot, email: profiles[nextRole].email },
        }));
        return { ...current, role: nextRole };
      }),
    });
  }

  function renderModal() {
    if (!modal) return null;
    
    const action = modal.mode === "delete" ? "Delete" : modal.mode === "edit" ? "Edit" : "Create";
    const entityLabel = modal.entity.charAt(0).toUpperCase() + modal.entity.slice(1);
    
    if (modal.mode === "delete") {
      return (
        <div className="modal-backdrop" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', minWidth: '400px', maxWidth: '500px' }}>
            <div className="section-head modal-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p className="eyebrow" style={{ color: '#666', fontSize: '12px' }}>Confirm action</p>
                <h2 style={{ margin: 0 }}>{`${action} ${entityLabel}`}</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleModalSubmit}>
              <p>Are you sure you want to delete {modal.record?.name ?? modal.record?.title ?? "this record"}?</p>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-button" onClick={closeModal} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '6px' }}>Cancel</button>
                <button type="submit" className="primary-button danger-button" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px' }}>Delete</button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    
    // Settings modal
    if (modal.entity === "settings") {
      const settings = data.settings;
      return (
        <div className="modal-backdrop" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', minWidth: '400px', maxWidth: '500px' }}>
            <div className="section-head modal-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p className="eyebrow" style={{ color: '#666', fontSize: '12px' }}>Settings</p>
                <h2 style={{ margin: 0 }}>Edit Settings</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleModalSubmit}>
              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Company Name</span>
                <input type="text" name="companyName" defaultValue={settings.companyName} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </label>
              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notification Email</span>
                <input type="email" name="notificationEmail" defaultValue={settings.notificationEmail} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" name="emailAlerts" defaultChecked={settings.emailAlerts} />
                <span>Email Alerts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" name="inAppNotifications" defaultChecked={settings.inAppNotifications} />
                <span>In-App Notifications</span>
              </label>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-button" onClick={closeModal} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '6px' }}>Cancel</button>
                <button type="submit" className="primary-button" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    
    const record = modal.record ?? {};
    const getFields = () => {
      switch (modal.entity) {
        case 'customer': return [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'company', label: 'Company', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
          { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Lead', 'At Risk'], required: true },
          { name: 'lastContact', label: 'Last Contact', type: 'date', required: false },
        ];
        case 'task': return [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'due', label: 'Due Date', type: 'date', required: false },
          { name: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], required: true },
          { name: 'assigned', label: 'Assigned To', type: 'text', required: false },
          { name: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Done'], required: true },
        ];
        case 'lead': return [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'company', label: 'Company', type: 'text', required: true },
          { name: 'contact', label: 'Contact Email', type: 'email', required: false },
          { name: 'value', label: 'Value', type: 'text', required: false },
          { name: 'source', label: 'Source', type: 'text', required: false },
          { name: 'assigned', label: 'Assigned To', type: 'text', required: false },
          { name: 'stage', label: 'Stage', type: 'select', options: leadStages, required: true },
        ];
        case 'deal': return [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'customer', label: 'Customer', type: 'text', required: true },
          { name: 'value', label: 'Value', type: 'text', required: false },
          { name: 'closeDate', label: 'Close Date', type: 'date', required: false },
          { name: 'stage', label: 'Stage', type: 'select', options: dealStages, required: true },
        ];
        default: return [];
      }
    };
    
    const fields = getFields();
    
    return (
      <div className="modal-backdrop" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', minWidth: '400px', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="section-head modal-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p className="eyebrow" style={{ color: '#666', fontSize: '12px' }}>CRM record</p>
              <h2 style={{ margin: 0 }}>{`${action} ${entityLabel}`}</h2>
            </div>
            <button type="button" className="icon-button" onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>
          <form className="modal-form" onSubmit={handleModalSubmit}>
            {fields.map((field) => (
              <label key={field.name} style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea name={field.name} defaultValue={record[field.name] || ''} required={field.required} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                ) : field.type === 'select' ? (
                  <select name={field.name} defaultValue={record[field.name] || field.options[0]} required={field.required} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    {field.options.map((option) => (<option key={option} value={option}>{option}</option>))}
                  </select>
                ) : (
                  <input type={field.type} name={field.name} defaultValue={record[field.name] || ''} required={field.required} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                )}
              </label>
            ))}
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="button" className="secondary-button" onClick={closeModal} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '6px' }}>Cancel</button>
              <button type="submit" className="primary-button" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>{action}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!preferences.isAuthenticated) {
    return renderAuth();
  }

  return renderAppShell({
    currentRoute,
    route,
    preferences,
    canAccessSettings,
    search,
    setSearch,
    currentProfile,
    onNavigate: navigate,
    onToggleTheme: () => setPreferences((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" })),
    onNotificationsToggle: () => setNotificationsOpen((current) => !current),
    onProfileToggle: () => setProfileOpen((current) => !current),
    onSignOut: signOut,
    onOpenModal: openModal,
    notificationsOpen,
    profileOpen,
    notifications: filteredNotifications,
    onDrop: handleDrop,
    onDragStart: handleDragStart,
    groupedLeads,
    groupedDeals,
    visibleTasks,
    visibleCustomers,
    selectedCustomer,
    loading,
    analytics,
    data,
    onSelectCustomer: (customer) => setData((current) => ({ ...current, selectedCustomerId: customer.id })),
    onUpdateTaskDone: handleUpdateTaskDone,
    modalContent: renderModal(),
  });
}

export default CRMApp;