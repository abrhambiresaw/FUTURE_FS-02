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
import { authApi } from "./authApi";
import { ModalShell } from "./components/Primitives";
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
  const demoEmails = Object.values(profiles).map((profile) => profile.email);
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
      selectedCustomerId: initialCustomers[0].id,
    }),
  );
  const [route, setRoute] = useState(() =>
    typeof window === "undefined" ? "/" : normalizePath(window.location.pathname),
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
    let cancelled = false;

    async function restoreSession() {
      const session = authApi.getStoredSession();
      if (!session?.token) {
        return;
      }

      try {
        const result = await authApi.me();
        if (cancelled) return;

        setPreferences((current) => ({
          ...current,
          isAuthenticated: true,
          role: result.user.role ?? current.role,
        }));
        setAuthDrafts((current) => ({
          ...current,
          login: { ...current.login, email: result.user.email },
          forgot: { ...current.forgot, email: result.user.email },
        }));
        setRoute((currentRoutePath) =>
          authRoutes.includes(normalizePath(currentRoutePath))
            ? "/dashboard"
            : currentRoutePath,
        );
      } catch {
        authApi.clearStoredSession();
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("crm-suite-data", JSON.stringify(data));
  }, [data]);

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

      if (
      !preferences.isAuthenticated &&
      !authRoutes.includes(route)
    ) {
      redirectPath = "/";
    }

    if (preferences.isAuthenticated && authRoutes.includes(route)) {
      redirectPath = "/dashboard";
    }

    if (!redirectPath) return undefined;

    const timer = window.setTimeout(() => replaceRoute(redirectPath), 0);
    return () => window.clearTimeout(timer);
  }, [preferences.isAuthenticated, route]);

  const currentRoute = parseRoute(route);
  const currentProfile = profiles[preferences.role];
  const canAccessSettings =
    preferences.role === "Admin" || preferences.role === "Manager";

  const visibleCustomers = useMemo(() => {
    const term = search.toLowerCase();
    return data.customers.filter((customer) =>
      [customer.name, customer.company, customer.email, customer.status].some(
        (value) => value.toLowerCase().includes(term),
      ),
    );
  }, [data.customers, search]);

  const visibleLeads = useMemo(() => {
    const term = search.toLowerCase();
    return data.leads.filter((lead) =>
      [lead.name, lead.company, lead.stage, lead.assigned, lead.source].some(
        (value) => value.toLowerCase().includes(term),
      ),
    );
  }, [data.leads, search]);

  const visibleDeals = useMemo(() => {
    const term = search.toLowerCase();
    return data.deals.filter((deal) =>
      [deal.title, deal.customer, deal.stage].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [data.deals, search]);

  const visibleTasks = useMemo(() => {
    const term = search.toLowerCase();
    return data.tasks.filter((task) =>
      [
        task.title,
        task.description,
        task.assigned,
        task.status,
        task.priority,
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [data.tasks, search]);

  const groupedLeads = useMemo(
    () =>
      leadStages.map((stage) => ({
        stage,
        items: visibleLeads.filter((lead) => lead.stage === stage),
      })),
    [visibleLeads],
  );
  const groupedDeals = useMemo(
    () =>
      dealStages.map((stage) => ({
        stage,
        items: visibleDeals.filter((deal) => deal.stage === stage),
      })),
    [visibleDeals],
  );
  const analytics = useMemo(
    () => ({
      monthlyRevenue: revenueSeries,
      conversionRate: conversionSeries,
      customerGrowth: [10, 18, 22, 30, 29, 36, 42, 48, 53, 60, 68, 76],
      performance: [82, 88, 77, 93, 86],
    }),
    [],
  );

  const filteredNotifications = useMemo(() => {
    const term = search.toLowerCase();
    return notifications.filter((item) =>
      [item.title, item.detail, item.type].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [search]);

  const selectedCustomer = useMemo(
    () =>
      data.customers.find(
        (customer) => String(customer.id) === String(data.selectedCustomerId),
      ) ?? data.customers[0],
    [data.customers, data.selectedCustomerId],
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
    authApi.clearStoredSession();
    setPreferences((current) => ({ ...current, isAuthenticated: false }));
    navigate("/", true);
  }

  function updateAuthDraft(page, field, value) {
    setAuthDrafts((current) => ({
      ...current,
      [page]: {
        ...current[page],
        [field]: value,
      },
    }));
  }

  async function submitAuth(page) {
    const draft = authDrafts[page];
    const email = String(draft.email ?? "").trim();
    const password = String(draft.password ?? "");

    setAuthBusy(true);
    setAuthMessage("");

    try {
      if (!authApi.isValidEmail(email)) {
        throw new Error("Enter a valid email address.");
      }

      if (page === "login") {
        if (password.length < 4) {
          throw new Error("Password must be at least 4 characters.");
        }

        const result = await authApi.login({ email, password });
        authApi.setStoredSession(result);
        setPreferences((current) => ({
          ...current,
          isAuthenticated: true,
          role: result.user.role ?? current.role,
        }));
        setAuthMessage("Signed in successfully.");
        navigate("/dashboard", true);
        return;
      }

      if (page === "register") {
        const name = String(draft.name ?? "").trim();
        const company = String(draft.company ?? "").trim();

        if (!name) {
          throw new Error("Full name is required.");
        }

        if (!company) {
          throw new Error("Company name is required.");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const result = await authApi.register({ name, email, company, password });
        authApi.setStoredSession(result);
        setPreferences((current) => ({
          ...current,
          isAuthenticated: true,
          role: result.user.role ?? current.role,
        }));
        setAuthMessage("Workspace created successfully.");
        navigate("/dashboard", true);
        return;
      }

      const result = await authApi.forgotPassword({ email });
      setAuthMessage(result.message);
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  function updateEntity(entity, updater) {
    setData((current) => ({ ...current, [entity]: updater(current[entity]) }));
  }

  function createCustomer(fields) {
    const nextCustomer = { id: Date.now(), ...fields };
    setData((current) => ({
      ...current,
      customers: [nextCustomer, ...current.customers],
      selectedCustomerId: nextCustomer.id,
    }));
    navigate(`/customers/${nextCustomer.id}`, true);
  }

  function createTask(fields) {
    const nextTask = { id: `task-${Date.now()}`, ...fields };
    setData((current) => ({ ...current, tasks: [nextTask, ...current.tasks] }));
  }

  function createLead(fields) {
    const nextLead = { id: `lead-${Date.now()}`, ...fields };
    setData((current) => ({ ...current, leads: [nextLead, ...current.leads] }));
  }

  function createDeal(fields) {
    const nextDeal = { id: `deal-${Date.now()}`, ...fields };
    setData((current) => ({ ...current, deals: [nextDeal, ...current.deals] }));
  }

  function updateCustomer(record, fields) {
    setData((current) => ({
      ...current,
      customers: current.customers.map((customer) =>
        String(customer.id) === String(record.id)
          ? { ...customer, ...fields }
          : customer,
      ),
    }));
  }

  function updateTask(record, fields) {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        String(task.id) === String(record.id) ? { ...task, ...fields } : task,
      ),
    }));
  }

  function updateLead(record, fields) {
    setData((current) => ({
      ...current,
      leads: current.leads.map((lead) =>
        String(lead.id) === String(record.id) ? { ...lead, ...fields } : lead,
      ),
    }));
  }

  function updateDeal(record, fields) {
    setData((current) => ({
      ...current,
      deals: current.deals.map((deal) =>
        String(deal.id) === String(record.id) ? { ...deal, ...fields } : deal,
      ),
    }));
  }

  function deleteEntity(entity, record) {
    setData((current) => {
      const next = { ...current };
      next[entity] = current[entity].filter(
        (item) => String(item.id) !== String(record.id),
      );
      if (
        entity === "customers" &&
        String(current.selectedCustomerId) === String(record.id)
      ) {
        next.selectedCustomerId = next.customers[0]?.id ?? null;
      }
      return next;
    });

    if (
      entity === "customers" &&
      currentRoute.page === "customer-detail" &&
      String(currentRoute.customerId) === String(record.id)
    ) {
      navigate("/customers", true);
    }
  }

  function moveLead(targetStage, leadId) {
    updateEntity("leads", (items) =>
      items.map((lead) =>
        String(lead.id) === String(leadId)
          ? { ...lead, stage: targetStage }
          : lead,
      ),
    );
  }

  function moveDeal(targetStage, dealId) {
    updateEntity("deals", (items) =>
      items.map((deal) =>
        String(deal.id) === String(dealId)
          ? { ...deal, stage: targetStage }
          : deal,
      ),
    );
  }

  function handleDragStart(item) {
    setDraggedItem(item);
  }

  function handleDrop(targetStage) {
    if (draggedItem?.type === "lead") moveLead(targetStage, draggedItem.id);
    if (draggedItem?.type === "deal") moveDeal(targetStage, draggedItem.id);
    setDraggedItem(null);
  }

  function handleModalSubmit(event) {
    event.preventDefault();
    if (!modal) return;

    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );

    if (modal.mode === "delete") {
      deleteEntity(`${modal.entity}s`, modal.record);
      closeModal();
      return;
    }

    if (modal.entity === "customer") {
      const payload = {
        name: String(values.name),
        company: String(values.company),
        email: String(values.email),
        phone: String(values.phone),
        status: String(values.status),
        lastContact: String(values.lastContact),
      };
      if (modal.mode === "edit") updateCustomer(modal.record, payload);
      else createCustomer(payload);
    }

    if (modal.entity === "task") {
      const payload = {
        title: String(values.title),
        description: String(values.description),
        due: String(values.due),
        priority: String(values.priority),
        assigned: String(values.assigned),
        status: String(values.status),
      };
      if (modal.mode === "edit") updateTask(modal.record, payload);
      else createTask(payload);
    }

    if (modal.entity === "lead") {
      const payload = {
        name: String(values.name),
        company: String(values.company),
        contact: String(values.contact),
        value: String(values.value),
        source: String(values.source),
        assigned: String(values.assigned),
        stage: String(values.stage),
      };
      if (modal.mode === "edit") updateLead(modal.record, payload);
      else createLead(payload);
    }

    if (modal.entity === "deal") {
      const payload = {
        title: String(values.title),
        customer: String(values.customer),
        value: String(values.value),
        closeDate: String(values.closeDate),
        stage: String(values.stage),
      };
      if (modal.mode === "edit") updateDeal(modal.record, payload);
      else createDeal(payload);
    }

    closeModal();
  }

  function renderAuth() {
    const authPage =
      currentRoute.page === "register"
        ? "register"
        : currentRoute.page === "forgot-password"
          ? "forgot"
          : currentRoute.page === "login"
            ? "login"
            : "home";
    return renderAuthPage({
      page: authPage,
      preferences,
      profiles,
      analytics,
      authDrafts,
      authMessage,
      authBusy,
      demoEmails,
      onNavigate: (page) => navigate(pathForPage(page), true),
      onAuthChange: updateAuthDraft,
      onAuthSubmit: submitAuth,
      onToggleTheme: () =>
        setPreferences((current) => ({
          ...current,
          theme: current.theme === "dark" ? "light" : "dark",
        })),
      onCycleRole: () =>
        setPreferences((current) => {
          const nextRole =
            current.role === "Admin"
              ? "Manager"
              : current.role === "Manager"
                ? "Sales Agent"
                : "Admin";

          setAuthDrafts((drafts) => ({
            ...drafts,
            login: {
              ...drafts.login,
              email: profiles[nextRole].email,
            },
            forgot: {
              ...drafts.forgot,
              email: profiles[nextRole].email,
            },
          }));

          return {
            ...current,
            role: nextRole,
          };
        }),
    });
  }

  function handleUpdateTaskDone(task) {
    updateTask(task, { status: "Done" });
  }

  function renderModal() {
    if (!modal) return null;

    const action =
      modal.mode === "delete"
        ? "Delete"
        : modal.mode === "edit"
          ? "Edit"
          : "Create";
    const entityLabel = modal.entity[0].toUpperCase() + modal.entity.slice(1);

    if (modal.mode === "delete") {
      return (
        <ModalShell title={`${action} ${entityLabel}`} subtitle="Confirm action" onClose={closeModal}>
          <form className="modal-form" onSubmit={handleModalSubmit}>
            <p>
              Are you sure you want to delete{" "}
              {modal.record?.name ?? modal.record?.title ?? "this record"}?
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="primary-button danger-button">
                Delete
              </button>
            </div>
          </form>
        </ModalShell>
      );
    }

    const record = modal.record ?? {};
    const fieldsByEntity = {
      customer: [
        ["name", "Name", "text"],
        ["company", "Company", "text"],
        ["email", "Email", "email"],
        ["phone", "Phone", "tel"],
        ["status", "Status", "select", ["Active", "Lead", "At Risk"]],
        ["lastContact", "Last Contact", "date"],
      ],
      task: [
        ["title", "Title", "text"],
        ["description", "Description", "textarea"],
        ["due", "Due Date", "date"],
        ["priority", "Priority", "select", ["High", "Medium", "Low"]],
        ["assigned", "Assigned To", "text"],
        ["status", "Status", "select", ["Open", "In Progress", "Done"]],
      ],
      lead: [
        ["name", "Name", "text"],
        ["company", "Company", "text"],
        ["contact", "Contact Email", "email"],
        ["value", "Value", "text"],
        ["source", "Source", "text"],
        ["assigned", "Assigned To", "text"],
        ["stage", "Stage", "select", leadStages],
      ],
      deal: [
        ["title", "Title", "text"],
        ["customer", "Customer", "text"],
        ["value", "Value", "text"],
        ["closeDate", "Close Date", "date"],
        ["stage", "Stage", "select", dealStages],
      ],
    };

    return (
      <ModalShell title={`${action} ${entityLabel}`} subtitle="CRM record" onClose={closeModal}>
        <form className="modal-form" onSubmit={handleModalSubmit}>
          {fieldsByEntity[modal.entity].map(([name, label, type, options]) => (
            <label key={name}>
              {label}
              {type === "textarea" ? (
                <textarea name={name} defaultValue={record[name] ?? ""} required />
              ) : type === "select" ? (
                <select name={name} defaultValue={record[name] ?? options[0]} required>
                  {options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input name={name} type={type} defaultValue={record[name] ?? ""} required />
              )}
            </label>
          ))}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {action}
            </button>
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
    onToggleTheme: () =>
      setPreferences((current) => ({
        ...current,
        theme: current.theme === "dark" ? "light" : "dark",
      })),
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
    onSelectCustomer: (customer) =>
      setData((current) => ({ ...current, selectedCustomerId: customer.id })),
    onUpdateTaskDone: handleUpdateTaskDone,
    modalContent: renderModal(),
  });
}

export default CRMApp;
