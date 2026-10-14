
import { useState } from "react";
import "./App.css";

const API = "http://localhost:8080";

const emptyItem = {
  title: "",
  type: "LOST",
  category: "Electronics",
  color: "",
  brand: "",
  location: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

function App() {
  const [page, setPage] = useState("home");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(emptyItem);
  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedLostItem, setSelectedLostItem] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password.");
      }

      const loggedInUser = await response.json();

      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setPassword("");
      setPage("dashboard");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Check whether Spring Boot is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setEmail("");
    setPassword("");
    clearMessages();
    setPage("home");
  };

  // UPDATE REPORT FORM
  const updateItem = (event) => {
    const { name, value } = event.target;
    setItem((previous) => ({ ...previous, [name]: value }));
  };

  // OPEN LOST OR FOUND FORM
  const openReportForm = (type) => {
    setItem({
      ...emptyItem,
      type,
      date: new Date().toISOString().slice(0, 10),
    });

    clearMessages();
    setPage(type === "LOST" ? "reportLost" : "reportFound");
  };

  // SUBMIT REPORT
  const handleSubmitReport = async (event) => {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Could not save the report. Please try again.");
      }

      const savedItem = await response.json();

      setSuccess(`${savedItem.title} saved successfully!`);
      setItem({
        ...emptyItem,
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Check whether Spring Boot is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // LOAD ALL REPORTS
  const openReports = async () => {
    setPage("reports");
    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/items`);

      if (!response.ok) {
        throw new Error("Could not load reports.");
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Check whether Spring Boot is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // DELETE REPORT
  const deleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    clearMessages();

    try {
      const response = await fetch(`${API}/api/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete this report.");
      }

      setReports((previous) =>
        previous.filter((report) => report.id !== id)
      );

      setSuccess("Report deleted successfully.");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend."
          : err.message
      );
    }
  };

  // OPEN SMART MATCHES
  const openMatches = async () => {
    setPage("matches");
    clearMessages();
    setMatches([]);
    setSelectedLostItem("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/items`);

      if (!response.ok) {
        throw new Error("Could not load reports.");
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Check whether Spring Boot is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // FIND MATCHES FOR SELECTED LOST ITEM
  const findMatches = async (lostItemId) => {
    if (!lostItemId) {
      setError("Please select a lost item first.");
      setSuccess("");
      return;
    }

    clearMessages();
    setMatches([]);
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/matches/${lostItemId}`
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Lost item not found."
            : "Could not find matching items."
        );
      }

      const data = await response.json();
      setMatches(data);

      if (data.length === 0) {
        setSuccess("No matching found items were found.");
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* NAVIGATION */}
      <nav className="navbar">
        <div
          className="logo"
          onClick={() => setPage(user ? "dashboard" : "home")}
        >
          🔎 Smart Lost &amp; Found
        </div>

        <div className="nav-links">
          <button
            onClick={() => {
              clearMessages();
              setPage(user ? "dashboard" : "home");
            }}
          >
            Home
          </button>

          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <button onClick={() => setPage("login")}>Login</button>
          )}
        </div>
      </nav>

      {/* HOME PAGE */}
      {page === "home" && (
        <main>
          <section className="hero">
            <h1>
              Find What You <span>Lost</span>
            </h1>

            <p>
              Report lost belongings, find matching items, and reconnect
              people with their possessions.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-btn"
                onClick={() =>
                  user ? openReportForm("LOST") : setPage("login")
                }
              >
                Report Lost Item
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  user ? openReportForm("FOUND") : setPage("login")
                }
              >
                Report Found Item
              </button>
            </div>
          </section>

          <section className="features">
            <h2>How Smart Lost &amp; Found Helps</h2>

            <div className="card-container">
              <div className="card">
                <div className="card-icon">📱</div>
                <h3>Report Lost</h3>
                <p>Share details about belongings you have lost.</p>
              </div>

              <div className="card">
                <div className="card-icon">📦</div>
                <h3>Report Found</h3>
                <p>Help someone recover a misplaced item.</p>
              </div>

              <div className="card">
                <div className="card-icon">🎯</div>
                <h3>Smart Matching</h3>
                <p>Compare item details to find possible matches.</p>
              </div>

              <div className="card">
                <div className="card-icon">🤝</div>
                <h3>Easy Recovery</h3>
                <p>Submit a claim to help recover belongings.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* LOGIN PAGE */}
      {page === "login" && (
        <section className="features login-section">
          <div className="login-box">
            <h1>Welcome Back 👋</h1>
            <p>Login to your Smart Lost &amp; Found account.</p>

            <form onSubmit={handleLogin}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <button
                className="primary-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          </div>
        </section>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <section className="features">
          <h1>Welcome, {user?.name || "User"}! 👋</h1>
          <p>Manage your lost and found items here.</p>

          <div className="card-container">
            <div className="card">
              <div className="card-icon">📱</div>
              <h3>Report Lost Item</h3>
              <p>Report an item you have lost.</p>
              <button
                className="primary-btn"
                onClick={() => openReportForm("LOST")}
              >
                Report Lost
              </button>
            </div>

            <div className="card">
              <div className="card-icon">📦</div>
              <h3>Report Found Item</h3>
              <p>Report an item you have found.</p>
              <button
                className="primary-btn"
                onClick={() => openReportForm("FOUND")}
              >
                Report Found
              </button>
            </div>

            <div className="card">
              <div className="card-icon">🔍</div>
              <h3>Smart Matches</h3>
              <p>Find items that might match your lost item.</p>
              <button className="primary-btn" onClick={openMatches}>
                View Matches
              </button>
            </div>

            <div className="card">
              <div className="card-icon">📋</div>
              <h3>My Reports</h3>
              <p>View reports saved in the system.</p>
              <button className="primary-btn" onClick={openReports}>
                My Reports
              </button>
            </div>

            <div className="card">
              <div className="card-icon">🤝</div>
              <h3>My Claims</h3>
              <p>View your claim requests.</p>
              <button
                className="primary-btn"
                onClick={() => {
                  clearMessages();
                  setPage("claims");
                }}
              >
                My Claims
              </button>
            </div>
          </div>
        </section>
      )}

      {/* REPORT LOST / FOUND FORM */}
      {(page === "reportLost" || page === "reportFound") && (
        <section className="features">
          <div className="login-box report-box">
            <h1>
              {page === "reportLost"
                ? "Report Lost Item 📱"
                : "Report Found Item 📦"}
            </h1>

            <p>Enter the item details below.</p>

            <form onSubmit={handleSubmitReport}>
              <label htmlFor="title">Item Name *</label>
              <input
                id="title"
                name="title"
                value={item.title}
                onChange={updateItem}
                placeholder="e.g. Samsung Phone"
                required
              />

              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={item.category}
                onChange={updateItem}
                required
              >
                <option>Electronics</option>
                <option>Accessories</option>
                <option>Documents</option>
                <option>Bags</option>
                <option>Clothing</option>
                <option>Books</option>
                <option>Other</option>
              </select>

              <label htmlFor="brand">Brand</label>
              <input
                id="brand"
                name="brand"
                value={item.brand}
                onChange={updateItem}
                placeholder="e.g. Samsung"
              />

              <label htmlFor="color">Colour</label>
              <input
                id="color"
                name="color"
                value={item.color}
                onChange={updateItem}
                placeholder="e.g. Black"
              />

              <label htmlFor="location">Location *</label>
              <input
                id="location"
                name="location"
                value={item.location}
                onChange={updateItem}
                placeholder="Where was it lost or found?"
                required
              />

              <label htmlFor="date">Date *</label>
              <input
                id="date"
                name="date"
                type="date"
                value={item.date}
                onChange={updateItem}
                required
              />

              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={item.description}
                onChange={updateItem}
                placeholder="Describe the item and identifying details"
                rows="4"
                required
              />

              <button
                className="primary-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Saving..." : "Submit Report"}
              </button>

              <button
                className="secondary-btn"
                type="button"
                onClick={() => setPage("dashboard")}
              >
                Back to Dashboard
              </button>
            </form>

            {success && <p style={{ color: "green" }}>{success}</p>}
            {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          </div>
        </section>
      )}

      {/* MY REPORTS */}
      {page === "reports" && (
        <section className="features">
          <h1>My Reports 📋</h1>
          <p>Reports retrieved from the backend.</p>

          {loading && <p>Loading reports...</p>}
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          {!loading && !error && reports.length === 0 && (
            <p>No reports found. Submit a lost or found item first.</p>
          )}

          <div className="card-container">
            {reports.map((report) => (
              <div className="card report-card" key={report.id}>
                <h3>{report.title}</h3>
                <p>
                  <strong>Report type:</strong> {report.type}
                </p>
                <p>
                  <strong>Category:</strong> {report.category || "Not specified"}
                </p>
                <p>
                  <strong>Brand:</strong> {report.brand || "Not specified"}
                </p>
                <p>
                  <strong>Colour:</strong> {report.color || "Not specified"}
                </p>
                <p>
                  <strong>Location:</strong> {report.location}
                </p>
                <p>
                  <strong>Date:</strong> {report.date}
                </p>
                <p>
                  <strong>Status:</strong> {report.status || "ACTIVE"}
                </p>
                <p>{report.description}</p>

                <button
                  className="secondary-btn"
                  onClick={() => deleteReport(report.id)}
                >
                  Delete Report
                </button>
              </div>
            ))}
          </div>

          <button
            className="primary-btn"
            onClick={openReports}
            disabled={loading}
          >
            Refresh Reports
          </button>

          <button
            className="secondary-btn"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>
        </section>
      )}

      {/* SMART MATCHES */}
      {page === "matches" && (
        <section className="features">
          <h1>Smart Matches 🔍</h1>
          <p>Select a lost item to find similar found items.</p>

          <div className="report-box">
            <label htmlFor="lostItemSelect">Select Lost Item</label>

            <select
              id="lostItemSelect"
              value={selectedLostItem}
              onChange={(e) => setSelectedLostItem(e.target.value)}
            >
              <option value="">-- Select a lost item --</option>

              {reports
                .filter(
                  (report) => report.type?.toUpperCase() === "LOST"
                )
                .map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.title} (ID: {report.id})
                  </option>
                ))}
            </select>

            <button
              className="primary-btn"
              onClick={() => findMatches(selectedLostItem)}
              disabled={loading}
            >
              {loading ? "Searching..." : "Find Matches"}
            </button>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          {!loading && matches.length > 0 && (
            <>
              <h2>Possible Matching Items</h2>

              <div className="card-container">
                {matches.map((match, index) => {
                  const foundItem = match.item;

                  if (!foundItem) return null;

                  return (
                    <div
                      className="card"
                      key={foundItem.id ?? index}
                    >
                      <h3>{foundItem.title}</h3>
                      <p>
                        <strong>Match Score:</strong> {match.matchScore}
                      </p>
                      <p>
                        <strong>Report type:</strong> {foundItem.type}
                      </p>
                      <p>
                        <strong>Category:</strong>{" "}
                        {foundItem.category || "N/A"}
                      </p>
                      <p>
                        <strong>Brand:</strong> {foundItem.brand || "N/A"}
                      </p>
                      <p>
                        <strong>Colour:</strong> {foundItem.color || "N/A"}
                      </p>
                      <p>
                        <strong>Location:</strong> {foundItem.location || "N/A"}
                      </p>
                      <p>
                        <strong>Date:</strong> {foundItem.date || "N/A"}
                      </p>
                      <p>
                        <strong>Status:</strong> {foundItem.status || "ACTIVE"}
                      </p>
                      <p>{foundItem.description}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button
            className="secondary-btn"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>
        </section>
      )}

      {/* MY CLAIMS */}
      {page === "claims" && (
        <section className="features">
          <h1>My Claims 🤝</h1>
          <p>
            Claim creation and review are available in the backend. The
            personal claims page still needs to be connected.
          </p>

          <button
            className="primary-btn"
            onClick={() => setPage("dashboard")}
          >
            Back to Dashboard
          </button>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 Smart Lost &amp; Found Management System</p>
      </footer>
    </div>
  );
}

export default App;
