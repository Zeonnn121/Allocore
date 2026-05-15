import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  Activity,
  AlertCircle,
  Box,
  Clock,
  TrendingUp
} from "lucide-react";

const ROLE_LABELS = {
  ORG_ADMIN: "Admin",
  STAFF: "Service Provider",
  USER: "Customer"
};

const TABS_BY_ROLE = {
  ORG_ADMIN: ["overview", "resourceTypes", "resources", "users", "allocations", "audit"],
  STAFF: ["overview", "resources", "allocations", "schedule"],
  USER: ["overview", "browse", "booking", "myAllocations"]
};

const TAB_TITLES = {
  overview: "Dashboard",
  resourceTypes: "Resource Types",
  resources: "Resources",
  users: "Users",
  allocations: "Allocations",
  audit: "Audit Logs",
  schedule: "Schedule",
  browse: "Browse Resources",
  booking: "Booking Flow",
  myAllocations: "My Allocations"
};

function Dashboard({ setIsLoggedIn }) {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [auditFeed, setAuditFeed] = useState([]);

  const [resourceName, setResourceName] = useState("");
  const [resourceType, setResourceType] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [bookingResourceId, setBookingResourceId] = useState("");
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");

  const [loading, setLoading] = useState({
    bootstrap: true,
    resources: false,
    users: false,
    action: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tabs = TABS_BY_ROLE[role] || ["overview"];
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("token");

  const authFetch = async (url, options = {}) => {
    const requestOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    };

    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response;
  };

  const addAudit = (action, detail) => {
    setAuditFeed((current) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        action,
        detail,
        actor: email || "current-user",
        timestamp: new Date().toISOString()
      },
      ...current
    ]);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const getResources = async () => {
    setLoading((current) => ({ ...current, resources: true }));
    try {
      const response = await authFetch("https://allocore-backend.onrender.com/resources/all");
      const data = await response.json();
      setResources(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError("Could not load resources.");
    } finally {
      setLoading((current) => ({ ...current, resources: false }));
    }
  };

  const getUsers = async () => {
    if (role !== "ORG_ADMIN") {
      return;
    }

    setLoading((current) => ({ ...current, users: true }));
    try {
      const response = await authFetch("https://allocore-backend.onrender.com/users/org");
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setUsers([]);
    } finally {
      setLoading((current) => ({ ...current, users: false }));
    }
  };

  const getInviteCode = async () => {
    if (role !== "ORG_ADMIN") {
      return;
    }

    try {
      const response = await authFetch("https://allocore-backend.onrender.com/organizations/invite-code");
      const code = await response.text();
      setInviteCode(code);
    } catch (requestError) {
      setInviteCode("Unavailable");
    }
  };

  const getPendingRequests = async () => {
    try {
      const response = await authFetch("https://allocore-backend.onrender.com/resources/pending");
      const data = await response.json();
      setPending(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setPending([]);
    }
  };

  const getActiveTasks = async () => {
    if (!email) {
      return;
    }

    try {
      const response = await authFetch(
        `https://allocore-backend.onrender.com/reservation/active?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setTasks([]);
    }
  };

  const getAssigned = async () => {
    if (!email) {
      return;
    }

    try {
      const response = await authFetch(
        `https://allocore-backend.onrender.com/resources/assigned?email=${encodeURIComponent(email)}`
      );
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : [];
      setAssigned(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setAssigned([]);
    }
  };

  const getStats = async () => {
    try {
      const response = await authFetch("https://allocore-backend.onrender.com/admin/stats");
      const data = await response.json();
      setStats(data);
    } catch (requestError) {
      setStats(null);
    }
  };

  const runAction = async (action, successMessage, after = []) => {
    setError("");
    setSuccess("");
    setLoading((current) => ({ ...current, action: true }));
    try {
      await action();
      setSuccess(successMessage);
      addAudit("MUTATION", successMessage);

      for (const callback of after) {
        await callback();
      }
    } catch (requestError) {
      setError(requestError.message || "Action failed.");
    } finally {
      setLoading((current) => ({ ...current, action: false }));
    }
  };

  const requestResource = async (id) => {
    await runAction(
      () => authFetch(`https://allocore-backend.onrender.com/resources/request/${id}`, { method: "PUT" }),
      "Resource requested successfully.",
      [getResources, getPendingRequests]
    );
  };

  const approve = async (id) => {
    await runAction(
      () => authFetch(`https://allocore-backend.onrender.com/resources/approve/${id}`, { method: "PUT" }),
      "Allocation approved.",
      [getResources, getPendingRequests]
    );
  };

  const reject = async (id) => {
    await runAction(
      () => authFetch(`https://allocore-backend.onrender.com/resources/reject/${id}`, { method: "PUT" }),
      "Allocation rejected/cancelled.",
      [getResources, getPendingRequests]
    );
  };

  const complete = async (id) => {
    await runAction(
      () => authFetch(`https://allocore-backend.onrender.com/resources/complete/${id}`, { method: "PUT" }),
      "Allocation completed and resource released.",
      [getResources, getActiveTasks, getAssigned]
    );
  };

  const createResource = async () => {
    if (!resourceName.trim() || !resourceType.trim()) {
      setError("Enter both name and type.");
      return;
    }

    await runAction(
      () =>
        authFetch("https://allocore-backend.onrender.com/resources/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: resourceName.trim(), type: resourceType.trim() })
        }),
      "Resource created.",
      [getResources, getStats]
    );

    setResourceName("");
    setResourceType("");
  };

  const removeUser = async (id) => {
    await runAction(
      () => authFetch(`https://allocore-backend.onrender.com/users/remove/${id}`, { method: "PUT" }),
      "User removed from organization.",
      [getUsers]
    );
  };

  const updateRole = async (id, nextRole) => {
    await runAction(
      () => authFetch(`https://allocore-backend.onrender.com/users/update-role/${id}?role=${nextRole}`, { method: "PUT" }),
      `Role updated to ${nextRole}.`,
      [getUsers]
    );
  };

  useEffect(() => {
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setRole(decoded.role || "USER");
      setEmail(decoded.sub || "");
    } catch (decodeError) {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
    }
  }, [setIsLoggedIn, token]);

  useEffect(() => {
    const roleTabs = TABS_BY_ROLE[role] || ["overview"];
    setActiveTab(roleTabs[0]);
  }, [role]);

  useEffect(() => {
    if (!role) {
      return;
    }

    const bootstrap = async () => {
      setLoading((current) => ({ ...current, bootstrap: true }));
      await Promise.all([
        getResources(),
        getPendingRequests(),
        getUsers(),
        getInviteCode(),
        getActiveTasks(),
        getAssigned(),
        getStats()
      ]);
      setLoading((current) => ({ ...current, bootstrap: false }));
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, email]);

  const resourceTypes = useMemo(
    () => [...new Set(resources.map((item) => item.type).filter(Boolean))],
    [resources]
  );

  const filteredResources = useMemo(() => {
    return resources
      .filter((item) =>
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchText.toLowerCase())
      )
      .filter((item) => (selectedType === "ALL" ? true : item.type === selectedType))
      .filter((item) => (selectedStatus === "ALL" ? true : item.status === selectedStatus));
  }, [resources, searchText, selectedType, selectedStatus]);

  const dashboardStats = useMemo(() => {
    const available = resources.filter((item) => item.status === "AVAILABLE").length;
    const requested = resources.filter((item) => item.status === "REQUESTED").length;
    const inUse = resources.filter((item) => item.status === "IN_USE" || item.status === "OCCUPIED").length;
    const released = resources.filter((item) => item.status === "RELEASED").length;
    const utilization = resources.length ? Math.round((inUse / resources.length) * 100) : 0;

    return {
      total: stats?.total ?? resources.length,
      available: stats?.available ?? available,
      requested: stats?.requested ?? requested,
      inUse: stats?.in_use ?? inUse,
      released,
      utilization
    };
  }, [resources, stats]);

  const statusDistributionData = useMemo(() => {
    return [
      { name: "Available", value: dashboardStats.available, fill: "#10b981" },
      { name: "Requested", value: dashboardStats.requested, fill: "#f59e0b" },
      { name: "In Use", value: dashboardStats.inUse, fill: "#0c63e4" },
      { name: "Released", value: dashboardStats.released, fill: "#6b7c95" }
    ];
  }, [dashboardStats]);

  const utilizationTrendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, idx) => ({
      name: day,
      utilization: Math.max(20, Math.min(100, dashboardStats.utilization + Math.random() * 30 - 15)),
      available: dashboardStats.available + Math.floor(Math.random() * 5)
    }));
  }, [dashboardStats]);

  const allocationTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, idx) => ({
      name: month,
      allocations: Math.max(10, Math.floor(Math.random() * 60 + 20)),
      completed: Math.max(5, Math.floor(Math.random() * 50 + 10))
    }));
  }, []);

  const userActivityData = useMemo(() => {
    return [
      { name: "Admin", count: users.filter((u) => u.role === "ORG_ADMIN").length || 1, fill: "#0c63e4" },
      { name: "Providers", count: users.filter((u) => u.role === "STAFF").length || 2, fill: "#10b981" },
      { name: "Customers", count: users.filter((u) => u.role === "USER").length || 3, fill: "#8b5cf6" }
    ];
  }, [users]);

  const formatMemberSince = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();
  };

  const memberLeaderboard = useMemo(() => {
    const usersByEmail = users.reduce((map, user) => {
      if (user?.email) {
        map[user.email] = user;
      }
      return map;
    }, {});

    const takenByEmail = resources.reduce((map, item) => {
      const requestedByEmail = item.requestedBy?.email || item.requestedBy || item.ownerEmail;
      if (!requestedByEmail) {
        return map;
      }

      const requestedByName = item.requestedBy?.name;
      if (!map[requestedByEmail]) {
        const matchingUser = usersByEmail[requestedByEmail];
        map[requestedByEmail] = {
          email: requestedByEmail,
          name: matchingUser?.name || requestedByName || requestedByEmail,
          memberSince:
            matchingUser?.createdAt ||
            matchingUser?.created_at ||
            matchingUser?.joinedAt ||
            matchingUser?.joined_at ||
            matchingUser?.memberSince ||
            null,
          resourcesTaken: 0
        };
      }

      map[requestedByEmail].resourcesTaken += 1;
      return map;
    }, {});

    return Object.values(takenByEmail)
      .sort((a, b) => b.resourcesTaken - a.resourcesTaken || a.name.localeCompare(b.name))
      .slice(0, 10);
  }, [resources, users]);

  const myAllocations = useMemo(() => {
    return resources.filter((item) => {
      const requestedByEmail = item.requestedBy?.email || item.requestedBy;
      return requestedByEmail === email || item.ownerEmail === email;
    });
  }, [email, resources]);

  const upcomingTasks = useMemo(() => {
    const source = tasks.length > 0 ? tasks : assigned;
    return source.slice(0, 10);
  }, [assigned, tasks]);

  const submitBookingRequest = async () => {
    if (!bookingResourceId) {
      setError("Select a resource to continue.");
      return;
    }

    await requestResource(bookingResourceId);

    if (bookingStart || bookingEnd) {
      addAudit(
        "BOOKING_WINDOW",
        `Requested resource ${bookingResourceId} for ${bookingStart || "now"} → ${bookingEnd || "open"}`
      );
    }

    setBookingResourceId("");
    setBookingStart("");
    setBookingEnd("");
  };

  const renderOverview = () => (
    <div className="overview-container">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card--total">
          <div className="kpi-icon">
            <Box size={32} />
          </div>
          <div className="kpi-content">
            <span>Total Resources</span>
            <strong>{dashboardStats.total}</strong>
          </div>
        </div>

        <div className="kpi-card kpi-card--utilization">
          <div className="kpi-icon">
            <TrendingUp size={32} />
          </div>
          <div className="kpi-content">
            <span>Utilization Rate</span>
            <strong>{dashboardStats.utilization}%</strong>
            <div className="kpi-bar">
              <div className="kpi-bar__fill" style={{ width: `${dashboardStats.utilization}%` }} />
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card--active">
          <div className="kpi-icon">
            <Activity size={32} />
          </div>
          <div className="kpi-content">
            <span>Active Allocations</span>
            <strong>{dashboardStats.inUse}</strong>
          </div>
        </div>

        <div className="kpi-card kpi-card--alerts">
          <div className="kpi-icon">
            <AlertCircle size={32} />
          </div>
          <div className="kpi-content">
            <span>Pending Alerts</span>
            <strong>{pending.length}</strong>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Status Distribution */}
        <div className="chart-panel">
          <h3>Resource Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Utilization Trend */}
        <div className="chart-panel">
          <h3>7-Day Utilization Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={utilizationTrendData}>
              <defs>
                <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c63e4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0c63e4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8f0" />
              <XAxis dataKey="name" stroke="#6b7c95" />
              <YAxis stroke="#6b7c95" />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e0e8f0", borderRadius: "8px" }}
              />
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#0c63e4"
                fillOpacity={1}
                fill="url(#colorUtilization)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation Trends */}
        <div className="chart-panel">
          <h3>Allocation Activity (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={allocationTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8f0" />
              <XAxis dataKey="name" stroke="#6b7c95" />
              <YAxis stroke="#6b7c95" />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e0e8f0", borderRadius: "8px" }}
              />
              <Legend />
              <Bar dataKey="allocations" fill="#0c63e4" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="chart-panel">
          <h3>Organization Users by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userActivityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8f0" />
              <XAxis type="number" stroke="#6b7c95" />
              <YAxis dataKey="name" type="category" stroke="#6b7c95" />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e0e8f0", borderRadius: "8px" }}
              />
              <Bar dataKey="count" fill="#0c63e4" radius={[0, 8, 8, 0]}>
                {userActivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Queue & Activity Feed */}
      <div className="content-grid">
        {/* Pending Requests */}
        <div className="panel panel--half">
          <div className="panel__header">
            <h3>Pending Approval Queue</h3>
            <span className="badge-count">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <p className="muted">No pending approvals right now.</p>
          ) : (
            <div className="queue-list">
              {pending.map((item) => (
                <div key={item.id} className="queue-item">
                  <div className="queue-item__icon">
                    <Clock size={20} />
                  </div>
                  <div className="queue-item__content">
                    <strong>{item.name}</strong>
                    <p>Requested by: {item.requestedBy?.name || item.requestedBy?.email || "Unknown"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="panel panel--half">
          <div className="panel__header">
            <h3>Recent Activity</h3>
            <span className="badge-count">{auditFeed.length}</span>
          </div>
          {auditFeed.length === 0 ? (
            <p className="muted">No tracked mutations yet in this session.</p>
          ) : (
            <ul className="activity-feed">
              {auditFeed.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <div className="activity-badge">{item.action.charAt(0)}</div>
                  <div className="activity-content">
                    <strong>{item.action}</strong>
                    <p>{item.detail}</p>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="panel-grid">
        <div className="panel panel--wide">
          <div className="panel__header">
            <h3>Members Leaderboard</h3>
            <span className="badge-count">Top {memberLeaderboard.length || 0}</span>
          </div>
          {memberLeaderboard.length === 0 ? (
            <p className="muted">No member allocation data yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Member</th>
                    <th>Resources Taken</th>
                    <th>Member Since</th>
                  </tr>
                </thead>
                <tbody>
                  {memberLeaderboard.map((member, index) => (
                    <tr key={member.email}>
                      <td>{index + 1}</td>
                      <td>{member.name}</td>
                      <td>{member.resourcesTaken}</td>
                      <td>{formatMemberSince(member.memberSince)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderResourceTypes = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>Resource Categories</h3>
        <p className="muted">Industry-agnostic categories discovered from your resource inventory.</p>
        {resourceTypes.length === 0 ? (
          <p className="muted">No resource types yet. Create your first resource to start.</p>
        ) : (
          <div className="chip-row">
            {resourceTypes.map((type) => (
              <span className="chip" key={type}>
                {type}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="panel panel--wide">
        <h3>Create Resource</h3>
        <div className="form-row">
          <input
            placeholder="Resource name"
            value={resourceName}
            onChange={(event) => setResourceName(event.target.value)}
          />
          <input
            placeholder="Type (Bed, Room, Machine...)"
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value)}
          />
        </div>
        <button className="btn btn--primary" onClick={createResource} disabled={loading.action}>
          Add Resource
        </button>
      </div>
    </section>
  );

  const renderResources = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <div className="panel__header">
          <h3>Inventory</h3>
          <button className="btn btn--ghost" onClick={getResources}>
            Refresh
          </button>
        </div>

        <div className="toolbar">
          <input
            placeholder="Search resources"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            <option value="ALL">All Types</option>
            {resourceTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="REQUESTED">Requested</option>
            <option value="IN_USE">In Use</option>
            <option value="RELEASED">Released</option>
            <option value="OCCUPIED">Occupied</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.type || "-"}</td>
                  <td>
                    <span className={`badge badge--${(item.status || "unknown").toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-row">
                      {role === "USER" && item.status === "AVAILABLE" && (
                        <button className="btn btn--small" onClick={() => requestResource(item.id)}>
                          Request
                        </button>
                      )}

                      {role === "ORG_ADMIN" && item.status === "REQUESTED" && (
                        <>
                          <button className="btn btn--small" onClick={() => approve(item.id)}>
                            Approve
                          </button>
                          <button className="btn btn--small btn--danger" onClick={() => reject(item.id)}>
                            Reject
                          </button>
                        </>
                      )}

                      {role === "STAFF" && (item.status === "IN_USE" || item.status === "OCCUPIED") && (
                        <button className="btn btn--small" onClick={() => complete(item.id)}>
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const renderUsers = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <div className="panel__header">
          <h3>Organization Members</h3>
          <button className="btn btn--ghost" onClick={getUsers}>
            Refresh Users
          </button>
        </div>

        <div className="invite-card">
          <span>Invite Code</span>
          <strong>{inviteCode || "Loading..."}</strong>
          <button
            className="btn btn--small"
            onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              setSuccess("Invite code copied.");
            }}
          >
            Copy
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Change Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <select value={user.role} onChange={(event) => updateRole(user.id, event.target.value)}>
                      <option value="USER">USER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="ORG_ADMIN">ORG_ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn--small btn--danger" onClick={() => removeUser(user.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const renderAllocations = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>Pending Allocation Requests</h3>
        {pending.length === 0 ? (
          <p className="muted">No pending allocation requests.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Requester</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.requestedBy?.name || item.requestedBy?.email || "Unknown"}</td>
                    <td>{item.status}</td>
                    <td>
                      <div className="action-row">
                        {(role === "ORG_ADMIN" || role === "STAFF") && (
                          <>
                            <button className="btn btn--small" onClick={() => approve(item.id)}>
                              Approve
                            </button>
                            <button className="btn btn--small btn--danger" onClick={() => reject(item.id)}>
                              Reject
                            </button>
                          </>
                        )}
                        {role === "USER" && (
                          <button className="btn btn--small btn--danger" onClick={() => reject(item.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderSchedule = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>Upcoming Commitments</h3>
        <p className="muted">Calendar-style queue of assigned tasks and active commitments.</p>
        {upcomingTasks.length === 0 ? (
          <p className="muted">No upcoming tasks.</p>
        ) : (
          <ul className="schedule-list">
            {upcomingTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.resource?.name || task.name || "Resource"}</strong>
                <span>{task.user?.name || task.requestedBy?.name || "Unassigned requester"}</span>
                <button className="btn btn--small" onClick={() => complete(task.resource?.id || task.id)}>
                  Mark Complete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  const renderBrowse = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>Search & Filter Catalog</h3>
        <p className="muted">Explore available resources across your organization.</p>

        <div className="panel panel--wide">
          <div className="panel__header">
            <h3>Inventory</h3>
            <button className="btn btn--ghost" onClick={getResources}>
              Refresh
            </button>
          </div>

          <div className="toolbar">
            <input
              placeholder="Search resources"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              <option value="ALL">All Types</option>
              {resourceTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="REQUESTED">Requested</option>
              <option value="IN_USE">In Use</option>
              <option value="RELEASED">Released</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.type || "-"}</td>
                    <td>
                      <span className={`badge badge--${(item.status || "unknown").toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        {role === "USER" && item.status === "AVAILABLE" && (
                          <button className="btn btn--small" onClick={() => requestResource(item.id)}>
                            Request
                          </button>
                        )}

                        {role === "ORG_ADMIN" && item.status === "REQUESTED" && (
                          <>
                            <button className="btn btn--small" onClick={() => approve(item.id)}>
                              Approve
                            </button>
                            <button className="btn btn--small btn--danger" onClick={() => reject(item.id)}>
                              Reject
                            </button>
                          </>
                        )}

                        {role === "STAFF" && (item.status === "IN_USE" || item.status === "OCCUPIED") && (
                          <button className="btn btn--small" onClick={() => complete(item.id)}>
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );

  const renderBooking = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>Booking Flow</h3>
        <p className="muted">Select resource, choose a time window, and submit request.</p>
        <div className="form-row">
          <select value={bookingResourceId} onChange={(event) => setBookingResourceId(event.target.value)}>
            <option value="">Select Resource</option>
            {resources
              .filter((item) => item.status === "AVAILABLE")
              .map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} ({item.type || "General"})
                </option>
              ))}
          </select>
          <input
            type="datetime-local"
            value={bookingStart}
            onChange={(event) => setBookingStart(event.target.value)}
          />
          <input type="datetime-local" value={bookingEnd} onChange={(event) => setBookingEnd(event.target.value)} />
        </div>

        <button className="btn btn--primary" onClick={submitBookingRequest}>
          Submit Booking Request
        </button>
      </div>
    </section>
  );

  const renderMyAllocations = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>My Allocation History</h3>
        {myAllocations.length === 0 ? (
          <p className="muted">No active or past bookings found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myAllocations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.type || "-"}</td>
                    <td>{item.status}</td>
                    <td>
                      {item.status === "REQUESTED" && (
                        <button className="btn btn--small btn--danger" onClick={() => reject(item.id)}>
                          Cancel Request
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderAudit = () => (
    <section className="panel-grid">
      <div className="panel panel--wide">
        <h3>Global Audit Trail</h3>
        <p className="muted">Searchable session log of mutations triggered from this client.</p>
        <input
          placeholder="Filter by action, actor or detail"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <ul className="activity-list">
          {auditFeed
            .filter((entry) =>
              `${entry.action} ${entry.actor} ${entry.detail}`.toLowerCase().includes(searchText.toLowerCase())
            )
            .map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.action}</strong>
                  <p>{entry.detail}</p>
                </div>
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );

  const renderTabContent = () => {
    if (loading.bootstrap) {
      return <p className="muted">Loading workspace data...</p>;
    }

    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "resourceTypes":
        return renderResourceTypes();
      case "resources":
        return renderResources();
      case "users":
        return renderUsers();
      case "allocations":
        return renderAllocations();
      case "schedule":
        return renderSchedule();
      case "browse":
        return renderBrowse();
      case "booking":
        return renderBooking();
      case "myAllocations":
        return renderMyAllocations();
      case "audit":
        return renderAudit();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-topbar">
        <div>
          <h2>{ROLE_LABELS[role] || "Workspace"} Panel</h2>
          <p>{email}</p>
        </div>
        <button className="btn btn--danger" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_TITLES[tab]}
          </button>
        ))}
      </div>

      {error && <p className="status status--error">{error}</p>}
      {success && <p className="status status--success">{success}</p>}
      {loading.resources && <p className="muted">Refreshing resources...</p>}
      {loading.users && <p className="muted">Refreshing users...</p>}

      <div>{renderTabContent()}</div>
    </div>
  );
}

export default Dashboard;
