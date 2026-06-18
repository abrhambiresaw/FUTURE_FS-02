import { appNavItems } from "../data";
import { MiniLineChart, Pill, SparkBars } from "../components/Primitives.jsx";

export function renderAppShell({
  currentRoute,
  route,
  preferences,
  canAccessSettings,
  search,
  setSearch,
  currentProfile,
  onNavigate,
  onToggleTheme,
  onNotificationsToggle,
  onProfileToggle,
  onSignOut,
  onOpenModal,
  notificationsOpen,
  profileOpen,
  notifications,
  onDrop,
  onDragStart,
  groupedLeads,
  groupedDeals,
  visibleTasks,
  visibleCustomers,
  selectedCustomer,
  loading,
  analytics,
  data,
  onSelectCustomer,
  onUpdateTaskDone,
  modalContent,
}) {
  const pageTitleMap = {
    dashboard: "Dashboard",
    customers: "Customers",
    "customer-detail": "Customer Detail",
    leads: "Leads",
    deals: "Deals",
    tasks: "Tasks",
    analytics: "Analytics",
    notifications: "Notifications",
    settings: "Settings",
  };

  function renderDashboard() {
    const kpis = [
      {
        label: "Total Customers",
        value: data.customers.length.toLocaleString(),
        delta: "+12.4%",
      },
      {
        label: "Total Leads",
        value: data.leads.length.toLocaleString(),
        delta: "+8.1%",
      },
      {
        label: "Active Deals",
        value: data.deals.length.toLocaleString(),
        delta: "+5.6%",
      },
      { label: "Revenue", value: "$284.6K", delta: "+18.2%" },
      {
        label: "Tasks Due Today",
        value: data.tasks
          .filter((task) => task.status !== "Done")
          .length.toString(),
        delta: "-3.0%",
      },
    ];

    return (
      <>
        <section className="kpi-grid">
          {kpis.map((item, index) => (
            <article className="card kpi-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.delta} from last month</small>
            </article>
          ))}
        </section>
        <section className="dashboard-grid">
          <article className="card chart-card wide">
            <div className="section-head">
              <div>
                <p className="eyebrow">Revenue performance</p>
                <h2>Monthly revenue</h2>
              </div>
              <Pill tone="green">+18.2%</Pill>
            </div>
            <div className="chart-wrap chart-lines">
              <MiniLineChart data={analytics.monthlyRevenue} />
            </div>
          </article>
          <article className="card chart-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Pipeline quality</p>
                <h2>Lead conversion</h2>
              </div>
              <Pill tone="blue">49%</Pill>
            </div>
            <div className="chart-wrap">
              <SparkBars values={analytics.conversionRate} />
            </div>
          </article>
          <article className="card timeline-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Activity feed</p>
                <h2>Recent activities</h2>
              </div>
            </div>
            <div className="timeline-list">
              <p className="text-muted">Recent activities will appear here</p>
            </div>
          </article>
          <article className="card tasks-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Priority queue</p>
                <h2>Upcoming tasks</h2>
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() => onOpenModal("task", "create")}
              >
                New task
              </button>
            </div>
            <div className="task-list compact">
              {data.tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="task-item">
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </>
    );
  }

  function renderCustomersPage() {
    return (
      <section className="card panel-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Customer management</p>
            <h2>Customers</h2>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onOpenModal("customer", "create")}
          >
            Add Customer
          </button>
        </div>
        <div className="toolbar">
          <input
            placeholder="Search customers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.company}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <Pill
                      tone={customer.status === "Active" ? "green" : "blue"}
                    >
                      {customer.status}
                    </Pill>
                  </td>
                  <td>{customer.lastContact}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="link-button"
                        onClick={() =>
                          onOpenModal("customer", "edit", customer)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="link-button danger"
                        onClick={() =>
                          onOpenModal("customer", "delete", customer)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderLeadAndDealPages(kind) {
    const columns = kind === "leads" ? groupedLeads : groupedDeals;
    return (
      <section className="card panel-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {kind === "leads" ? "Lead management" : "Deal management"}
            </p>
            <h2>{kind === "leads" ? "Kanban pipeline" : "Sales pipeline"}</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onOpenModal(kind === "leads" ? "lead" : "deal", "create")
            }
          >
            Add
          </button>
        </div>
        <div className="kanban-grid">
          {columns.map((column) => (
            <div
              key={column.stage}
              className="kanban-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(column.stage)}
            >
              <div className="kanban-header">
                <strong>{column.stage}</strong>
                <span>{column.items.length}</span>
              </div>
              <div className="kanban-cards">
                {column.items.map((item) => (
                  <article
                    key={item.id}
                    className="kanban-card"
                    draggable
                    onDragStart={() =>
                      onDragStart({
                        type: kind === "leads" ? "lead" : "deal",
                        id: item.id,
                      })
                    }
                  >
                    <strong>{item.name ?? item.title}</strong>
                    <small>{item.company ?? item.customer}</small>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderTasksPage() {
    return (
      <section className="card panel-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Task management</p>
            <h2>Task board and list</h2>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onOpenModal("task", "create")}
          >
            + Create Task
          </button>
        </div>
        <div className="task-board">
          {["Open", "In Progress", "Done"].map((status) => (
            <div className="task-column" key={status}>
              <div className="kanban-header">
                <strong>{status}</strong>
                <span>
                  {visibleTasks.filter((t) => t.status === status).length}
                </span>
              </div>
              <div className="task-list">
                {visibleTasks
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="task-card"
                      style={{
                        backgroundColor: "#1e1e1e",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "12px",
                        border: "1px solid #333",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <strong
                          style={{
                            fontSize: "16px",
                            color: "#fff",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          {task.title}
                        </strong>
                        <p
                          style={{
                            color: "#9ca3af",
                            fontSize: "13px",
                            margin: 0,
                          }}
                        >
                          {task.description || "No description"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginBottom: "16px",
                          fontSize: "12px",
                          color: "#9ca3af",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          Priority:{" "}
                          <strong
                            style={{
                              color:
                                task.priority === "High"
                                  ? "#f87171"
                                  : task.priority === "Medium"
                                    ? "#fbbf24"
                                    : "#34d399",
                            }}
                          >
                            {task.priority}
                          </strong>
                        </span>
                        <span>
                          Assigned:{" "}
                          <strong style={{ color: "#fff" }}>
                            {task.assigned || "Unassigned"}
                          </strong>
                        </span>
                        <span>
                          Due:{" "}
                          <strong style={{ color: "#fff" }}>
                            {task.due || "No date"}
                          </strong>
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "8px",
                          paddingTop: "12px",
                          borderTop: "1px solid #333",
                        }}
                      >
                        <button
                          onClick={() => onOpenModal("task", "edit", task)}
                          style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                          }}
                        >
                          Edit
                        </button>
                        {task.status !== "Done" && (
                          <button
                            onClick={() => onUpdateTaskDone(task)}
                            style={{
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => onOpenModal("task", "delete", task)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                {visibleTasks.filter((t) => t.status === status).length ===
                  0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#6b7280",
                    }}
                  >
                    No tasks in {status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderSimplePages() {
    if (currentRoute.page === "analytics") {
      return (
        <section className="analytics-grid">
          <article className="card chart-card wide">
            <div className="section-head">
              <div>
                <p className="eyebrow">Analytics</p>
                <h2>Monthly revenue</h2>
              </div>
            </div>
            <MiniLineChart data={analytics.monthlyRevenue} />
          </article>
          <article className="card chart-card">
            <p className="eyebrow">Customer growth</p>
            <SparkBars values={analytics.customerGrowth} />
          </article>
          <article className="card chart-card">
            <p className="eyebrow">Sales performance</p>
            <SparkBars values={analytics.performance} />
          </article>
        </section>
      );
    }

    if (currentRoute.page === "notifications") {
      return (
        <section className="card panel-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Notification center</p>
              <h2>Activity alerts</h2>
            </div>
          </div>
          <div className="notification-list">
            {notifications.map((item) => (
              <article key={item.title} className="notification-item">
                <Pill tone="blue">{item.type}</Pill>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (currentRoute.page === "settings") {
      return (
        <section className="card panel-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">System Settings</p>
              <h2>Workspace Settings</h2>
            </div>

            <button
              className="secondary-button"
              onClick={() => onOpenModal("settings", "edit")}
            >
              Edit Settings
            </button>
          </div>

          <div className="settings-grid">
            <article className="card settings-card">
              <p className="eyebrow">Company</p>

              <h3>{data.settings.companyName}</h3>

              <p className="text-muted">Main company profile</p>
            </article>

            <article className="card settings-card">
              <p className="eyebrow">Notification Email</p>

              <h3>{data.settings.notificationEmail}</h3>
            </article>

            <article className="card settings-card">
              <p className="eyebrow">Email Alerts</p>

              <h3>{data.settings.emailAlerts ? "Enabled" : "Disabled"}</h3>
            </article>

            <article className="card settings-card">
              <p className="eyebrow">In App Notifications</p>

              <h3>
                {data.settings.inAppNotifications ? "Enabled" : "Disabled"}
              </h3>
            </article>
          </div>
        </section>
      );
    }

    if (currentRoute.page === "customers") return renderCustomersPage();
    if (currentRoute.page === "leads") return renderLeadAndDealPages("leads");
    if (currentRoute.page === "deals") return renderLeadAndDealPages("deals");
    if (currentRoute.page === "tasks") return renderTasksPage();

    return renderDashboard();
  }

  return (
    <div className="crm-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">CR</div>
          <div>
            <strong>CRM Suite</strong>
            <span>SaaS command center</span>
          </div>
        </div>
        <nav className="nav-list">
          {appNavItems.map((item) => {
            const active =
              item.path === "/customers"
                ? currentRoute.page.startsWith("customer")
                : `/${currentRoute.page}` === item.path;
            return (
              <button
                key={item.path}
                type="button"
                className={active ? "nav-item active" : "nav-item"}
                onClick={() => onNavigate(item.path)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="content-area">
        <header className="topbar card">
          <div>
            <p className="eyebrow">Premium CRM dashboard</p>
            <h1>{pageTitleMap[currentRoute.page] ?? "CRM"}</h1>
          </div>
          <div className="topbar-actions">
            <div className="search-wrap">
              <input
                placeholder="Global search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="icon-button" onClick={onToggleTheme}>
              {preferences.theme === "dark" ? "☾" : "☀"}
            </button>
            <button className="icon-button" onClick={onNotificationsToggle}>
              🔔
            </button>
            <button className="profile-chip" onClick={onProfileToggle}>
              <span>{currentProfile.name}</span>
              <small>{currentProfile.role}</small>
            </button>
          </div>
        </header>

        <section className="status-strip card">
          <div>
            <strong>{currentProfile.name}</strong>
            <span>{currentProfile.email}</span>
          </div>
          <div>
            <Pill tone="green">{preferences.role}</Pill>
            <Pill tone="blue">
              {canAccessSettings ? "Full settings access" : "Limited"}
            </Pill>
          </div>
        </section>

        {profileOpen && (
          <div className="flyout card">
            <button
              className="flyout-item"
              onClick={() => onNavigate("/settings")}
            >
              Profile settings
            </button>
            <button
              className="flyout-item"
              onClick={() => onOpenModal("customer", "create")}
            >
              Add customer
            </button>
            <button className="flyout-item" onClick={onSignOut}>
              Log out
            </button>
          </div>
        )}

        {notificationsOpen && (
          <div className="flyout notifications-flyout card">
            <div className="flyout-head">
              <strong>Notifications</strong>
              <button className="text-button" onClick={onNotificationsToggle}>
                Close
              </button>
            </div>
            {notifications.map((item) => (
              <div key={item.title} className="notification-item dense">
                <Pill tone="blue">{item.type}</Pill>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {renderSimplePages()}
        {modalContent}
      </main>
    </div>
  );
}
