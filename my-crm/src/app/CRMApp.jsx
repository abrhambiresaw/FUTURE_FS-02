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
import { ModalShell } from "../components/Primitives";
import { renderAppShell } from "./pages/AppPages";
import { renderAuthPage } from "./pages/crmPages";
import {
  login,
  register,
  getMe,
  forgotPassword,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createTask,
  updateTask,
  deleteTask,
  createLead,
  updateLead,
  deleteLead,
  createDeal,
  updateDeal,
  deleteDeal,
  syncAllData,
} from "./api";
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

  useEffect(() => {
    async function loadDataFromBackend() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const backendData = await syncAllData();
        if (backendData) {
          setData((prev) => ({
            ...prev,
            customers: backendData.customers?.length ? backendData.customers : prev.customers,
            leads: backendData.leads?.length ? backendData.leads : prev.leads,
            deals: backendData.deals?.length ? backendData.deals : prev.deals,
            tasks: backendData.tasks?.length ? backendData.tasks : prev.tasks,
          }));
        }
      } catch (error) {
        console.error("Failed to load data from backend:", error);
      }
    }
    loadDataFromBackend();
  }, [preferences.isAuthenticated]);

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

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const result = await getMe();
        if (cancelled) return;
        setPreferences((current) => ({
          ...current,
          isAuthenticated: true,
          role: result.user?.role ?? current.role,
        }));
        setAuthDrafts((current) => ({
          ...current,
          login: { ...current.login, email: result.user?.email },
          forgot: { ...current.forgot, email: result.user?.email },
        }));
        setRoute((currentRoutePath) =>
          authRoutes.includes(normalizePath(currentRoutePath)) ? "/dashboard" : currentRoutePath
        );
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    restoreSession();
    return () => { cancelled = true; };
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
    setModal({ entity, mode, record });
  }

  function closeModal() {
    setModal(null);
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
        if (password.length < 4) throw new Error("Password must be at least 4 characters.");
        const result = await login({ email, password });
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setPreferences((current) => ({ ...current, isAuthenticated: true, role: result.user?.role ?? current.role }));
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
        const result = await register({ name, email, company, password });
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setPreferences((current) => ({ ...current, isAuthenticated: true, role: result.user?.role ?? current.role }));
        setAuthMessage("Workspace created successfully.");
        navigate("/dashboard", true);
        return;
      }
      const result = await forgotPassword(email);
      setAuthMessage(result.message);
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function createCustomerRecord(fields) {
    try {
      const newCustomer = await createCustomer(fields);
      setData((current) => ({ ...current, customers: [newCustomer, ...current.customers], selectedCustomerId: newCustomer.id }));
      navigate(`/customers/${newCustomer.id}`, true);
      return true;
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create customer: " + error.message);
      return false;
    }
  }

  async function updateCustomerRecord(record, fields) {
    try {
      const updated = await updateCustomer(record.id, fields);
      setData((current) => ({ ...current, customers: current.customers.map((c) => String(c.id) === String(record.id) ? updated : c) }));
      return true;
    } catch (error) {
      console.error("Failed to update customer:", error);
      alert("Failed to update customer: " + error.message);
      return false;
    }
  }

  async function deleteCustomerRecord(record) {
    try {
      await deleteCustomer(record.id);
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
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Failed to delete customer: " + error.message);
      return false;
    }
  }

  async function createTaskRecord(fields) {
    try {
      const newTask = await createTask(fields);
      setData((current) => ({ ...current, tasks: [newTask, ...current.tasks] }));
      return true;
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task: " + error.message);
      return false;
    }
  }

  async function updateTaskRecord(record, fields) {
    try {
      const updated = await updateTask(record.id, fields);
      setData((current) => ({ ...current, tasks: current.tasks.map((t) => String(t.id) === String(record.id) ? updated : t) }));
      return true;
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Failed to update task: " + error.message);
      return false;
    }
  }

  async function deleteTaskRecord(record) {
    try {
      await deleteTask(record.id);
      setData((current) => ({ ...current, tasks: current.tasks.filter((item) => String(item.id) !== String(record.id)) }));
      return true;
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task: " + error.message);
      return false;
    }
  }

  async function createLeadRecord(fields) {
    try {
      const newLead = await createLead(fields);
      setData((current) => ({ ...current, leads: [newLead, ...current.leads] }));
      return true;
    } catch (error) {
      console.error("Failed to create lead:", error);
      alert("Failed to create lead: " + error.message);
      return false;
    }
  }

  async function updateLeadRecord(record, fields) {
    try {
      const updated = await updateLead(record.id, fields);
      setData((current) => ({ ...current, leads: current.leads.map((l) => String(l.id) === String(record.id) ? updated : l) }));
      return true;
    } catch (error) {
      console.error("Failed to update lead:", error);
      alert("Failed to update lead: " + error.message);
      return false;
    }
  }

  async function deleteLeadRecord(record) {
    try {
      await deleteLead(record.id);
      setData((current) => ({ ...current, leads: current.leads.filter((item) => String(item.id) !== String(record.id)) }));
      return true;
    } catch (error) {
      console.error("Failed to delete lead:", error);
      alert("Failed to delete lead: " + error.message);
      return false;
    }
  }

  async function createDealRecord(fields) {
    try {
      const newDeal = await createDeal(fields);
      setData((current) => ({ ...current, deals: [newDeal, ...current.deals] }));
      return true;
    } catch (error) {
      console.error("Failed to create deal:", error);
      alert("Failed to create deal: " + error.message);
      return false;
    }
  }

  async function updateDealRecord(record, fields) {
    try {
      const updated = await updateDeal(record.id, fields);
      setData((current) => ({ ...current, deals: current.deals.map((d) => String(d.id) === String(record.id) ? updated : d) }));
      return true;
    } catch (error) {
      console.error("Failed to update deal:", error);
      alert("Failed to update deal: " + error.message);
      return false;
    }
  }

  async function deleteDealRecord(record) {
    try {
      await deleteDeal(record.id);
      setData((current) => ({ ...current, deals: current.deals.filter((item) => String(item.id) !== String(record.id)) }));
      return true;
    } catch (error) {
      console.error("Failed to delete deal:", error);
      alert("Failed to delete deal: " + error.message);
      return false;
    }
  }

  async function moveLeadToStage(targetStage, leadId) {
    const lead = data.leads.find(l => String(l.id) === String(leadId));
    if (lead) await updateLeadRecord(lead, { ...lead, stage: targetStage });
  }

  async function moveDealToStage(targetStage, dealId) {
    const deal = data.deals.find(d => String(d.id) === String(dealId));
    if (deal) await updateDealRecord(deal, { ...deal, stage: targetStage });
  }

  function handleDragStart(item) {
    setDraggedItem(item);
  }

  async function handleDrop(targetStage) {
    if (draggedItem?.type === "lead") await moveLeadToStage(targetStage, draggedItem.id);
    if (draggedItem?.type === "deal") await moveDealToStage(targetStage, draggedItem.id);
    setDraggedItem(null);
  }

  async function handleModalSubmit(event) {
    event.preventDefault();
    if (!modal) return;
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    if (modal.mode === "delete") {
      if (modal.entity === "customer") await deleteCustomerRecord(modal.record);
      if (modal.entity === "task") await deleteTaskRecord(modal.record);
      if (modal.entity === "lead") await deleteLeadRecord(modal.record);
      if (modal.entity === "deal") await deleteDealRecord(modal.record);
      closeModal();
      return;
    }
    if (modal.entity === "customer") {
      if (modal.mode === "edit") await updateCustomerRecord(modal.record, values);
      else await createCustomerRecord(values);
    }
    if (modal.entity === "task") {
      if (modal.mode === "edit") await updateTaskRecord(modal.record, values);
      else await createTaskRecord(values);
    }
    if (modal.entity === "lead") {
      if (modal.mode === "edit") await updateLeadRecord(modal.record, values);
      else await createLeadRecord(values);
    }
    if (modal.entity === "deal") {
      if (modal.mode === "edit") await updateDealRecord(modal.record, values);
      else await createDealRecord(values);
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
        <ModalShell title={`${action} ${entityLabel}`} subtitle="Confirm action" onClose={closeModal}>
          <form className="modal-form" onSubmit={handleModalSubmit}>
            <p>Are you sure you want to delete {modal.record?.name ?? modal.record?.title ?? "this record"}?</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeModal}>Cancel</button>
              <button type="submit" className="primary-button danger-button">Delete</button>
            </div>
          </form>
        </ModalShell>
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
      <ModalShell title={`${action} ${entityLabel}`} subtitle="CRM record" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleModalSubmit}>
          {fields.map((field) => (
            <label key={field.name}>
              {field.label}
              {field.type === 'textarea' ? (
                <textarea name={field.name} defaultValue={record[field.name] || ''} required={field.required} />
              ) : field.type === 'select' ? (
                <select name={field.name} defaultValue={record[field.name] || field.options[0]} required={field.required}>
                  {field.options.map((option) => (<option key={option} value={option}>{option}</option>))}
                </select>
              ) : (
                <input type={field.type} name={field.name} defaultValue={record[field.name] || ''} required={field.required} />
              )}
            </label>
          ))}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>Cancel</button>
            <button type="submit" className="primary-button">{action}</button>
          </div>
        </form>
      </ModalShell>
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