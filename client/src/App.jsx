
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  ImagePlus,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
  X,
  Upload,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const TOKEN_KEY = "civicpulse_token";

const CATEGORIES = [
  "Garbage",
  "Pothole",
  "Streetlight",
  "Water Leakage",
  "Public Property",
  "Other",
];

const STATUSES = ["reported", "in-progress", "resolved", "rejected"];
const PRIORITIES = ["low", "medium", "high"];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "Garbage",
  priority: "medium",
  address: "",
  longitude: "",
  latitude: "",
};

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function formatDate(date) {
  if (!date) return "Unavailable";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Unavailable"
    : parsed.toLocaleString();
}

function formatStatus(status = "reported") {
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function StatusBadge({ status = "reported" }) {
  const styles = {
    reported: "bg-blue-50 text-blue-700 ring-blue-200",
    "in-progress": "bg-amber-50 text-amber-700 ring-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.reported
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function PriorityBadge({ priority = "medium" }) {
  const styles = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-orange-50 text-orange-700",
    high: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[priority] || styles.medium
      }`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
    </span>
  );
}

function StatCard({ label, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, admin, onUpdateStatus, onView }) {
  const [nextStatus, setNextStatus] = useState(issue.status || "reported");
  const [resolutionNote, setResolutionNote] = useState(
    issue.resolutionNote || ""
  );
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    setNextStatus(issue.status || "reported");
    setResolutionNote(issue.resolutionNote || "");
  }, [issue.status, issue.resolutionNote]);

  async function handleUpdate() {
    setUpdateError("");

    if (nextStatus === "resolved" && !resolutionNote.trim()) {
      setUpdateError("Enter a resolution note before resolving this issue.");
      return;
    }

    setUpdating(true);

    try {
      await onUpdateStatus(issue._id, nextStatus, resolutionNote.trim());
    } catch (error) {
      setUpdateError(error.message || "Unable to update issue.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {issue.category || "Other"}
          </p>
          <h3 className="mt-2 break-words text-lg font-bold text-slate-900">
            {issue.title}
          </h3>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {issue.description}
      </p>

      {issue.imageUrl && (
        <img
          src={issue.imageUrl}
          alt={`Photo for ${issue.title}`}
          loading="lazy"
          className="mt-4 max-h-48 w-full rounded-xl border border-slate-200 object-cover"
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={issue.priority} />
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          <span className="break-words">
            {issue.location?.address || "No address provided"}
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Clock3 size={16} className="mt-0.5 shrink-0" />
          <span>Reported: {formatDate(issue.createdAt)}</span>
        </p>
        {admin && issue.reportedBy?.name && (
          <p className="flex items-start gap-2">
            <Users size={16} className="mt-0.5 shrink-0" />
            <span>Reported by {issue.reportedBy.name}</span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onView(issue._id)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        View full details <ArrowRight size={16} />
      </button>

      {admin && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h4 className="text-sm font-bold text-slate-900">
            Manage issue status
          </h4>
          <label className="mt-3 block text-xs font-semibold text-slate-600">
            New status
          </label>
          <select
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>

          {nextStatus === "resolved" && (
            <>
              <label className="mt-3 block text-xs font-semibold text-slate-600">
                Resolution note
              </label>
              <textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                rows={3}
                placeholder="Explain how the issue was resolved..."
                className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </>
          )}

          {updateError && (
            <p className="mt-2 text-sm text-red-600">{updateError}</p>
          )}

          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating || nextStatus === issue.status}
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? "Updating..." : "Save status"}
          </button>
        </div>
      )}
    </article>
  );
}

function IssueDetailsModal({ issue, onClose }) {
  if (!issue) return null;

  const history = [...(issue.statusHistory || [])].sort(
    (a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0)
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-detail-title"
        className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">
              {issue.category}
            </p>
            <h2
              id="issue-detail-title"
              className="mt-1 break-words text-2xl font-bold text-slate-900"
            >
              {issue.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close issue details"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <h3 className="font-semibold text-slate-900">Description</h3>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
              {issue.description || "No description provided."}
            </p>
          </div>

          {issue.imageUrl && (
            <div>
              <h3 className="font-semibold text-slate-900">Reported photo</h3>
              <a
                href={issue.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block"
              >
                <img
                  src={issue.imageUrl}
                  alt={`Photo for ${issue.title}`}
                  className="max-h-80 w-full rounded-xl border border-slate-200 object-contain"
                />
              </a>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-slate-900">Location</h3>
            <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>{issue.location?.address || "No address provided"}</span>
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Reported on</h3>
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(issue.createdAt)}
            </p>
          </div>

          {issue.reportedBy?.name && (
            <div>
              <h3 className="font-semibold text-slate-900">Reported by</h3>
              <p className="mt-1 text-sm text-slate-600">
                {issue.reportedBy.name}
              </p>
            </div>
          )}

          {issue.assignedTo?.name && (
            <div>
              <h3 className="font-semibold text-slate-900">Assigned to</h3>
              <p className="mt-1 text-sm text-slate-600">
                {issue.assignedTo.name}
              </p>
            </div>
          )}

          {issue.resolutionNote && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="font-semibold text-emerald-900">
                Resolution note
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-800">
                {issue.resolutionNote}
              </p>
            </div>
          )}

          {issue.resolutionImageUrl && (
            <div>
              <h3 className="font-semibold text-slate-900">
                Resolution evidence
              </h3>
              <a
                href={issue.resolutionImageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block"
              >
                <img
                  src={issue.resolutionImageUrl}
                  alt={`Resolution evidence for ${issue.title}`}
                  className="max-h-80 w-full rounded-xl border border-slate-200 object-contain"
                />
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Activity size={20} className="text-emerald-700" />
            Status history
          </h3>

          {history.length ? (
            <ol className="mt-5 space-y-5">
              {history.map((entry, index) => (
                <li
                  key={entry._id || `${entry.status}-${index}`}
                  className="flex gap-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <StatusBadge status={entry.status} />
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                      {entry.note || "Status updated"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(entry.changedAt)}
                    </p>
                    {entry.changedBy?.name && (
                      <p className="mt-1 text-xs text-slate-500">
                        Updated by {entry.changedBy.name}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No status history available.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Close details
        </button>
      </section>
    </div>
  );
}

function AuthScreen({ onLogin, busy, error }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin({
      name: name.trim(),
      email: email.trim(),
      password,
      isRegister,
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="flex flex-col justify-between bg-emerald-700 p-8 text-white sm:p-12">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck size={27} />
            </div>
            <h1 className="mt-8 text-4xl font-bold tracking-tight">
              CivicPulse
            </h1>
            <p className="mt-4 max-w-sm leading-7 text-emerald-50">
              Report local problems, follow their progress, and help build a
              better community.
            </p>
          </div>
          <div className="mt-12 space-y-4">
            {[
              "Report civic issues in your area",
              "Track issue status and updates",
              "Create a more accountable community",
            ].map((item) => (
              <p key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={18} />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="p-8 sm:p-12">
          <p className="text-sm font-semibold text-emerald-700">
            COMMUNITY PORTAL
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isRegister
              ? "Register to start reporting civic issues."
              : "Sign in to continue to your CivicPulse dashboard."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isRegister && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={
                  isRegister ? "At least 8 characters" : "Enter your password"
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegister((current) => !current)}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const loadCurrentUser = useCallback(async (activeToken) => {
    try {
      const response = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      setUser(response.data.user);
      return true;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setUser(null);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadIssues = useCallback(async () => {
    if (!token || !user) return;

    setIssuesLoading(true);
    setError("");

    try {
      const params = { page: 1, limit: 100 };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (!isAdmin) params.mine = true;

      const response = await api.get("/api/issues", {
        headers: authHeaders,
        params,
      });

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.issues || data.data?.issues || data.data || [];

      setIssues(Array.isArray(list) ? list : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load issues."));
    } finally {
      setIssuesLoading(false);
    }
  }, [
    token,
    user,
    isAdmin,
    categoryFilter,
    statusFilter,
    authHeaders,
  ]);

  useEffect(() => {
    if (token) {
      loadCurrentUser(token);
    } else {
      setAuthLoading(false);
      setUser(null);
    }
  }, [token, loadCurrentUser]);

  useEffect(() => {
    if (token && user) {
      loadIssues();
    } else {
      setIssues([]);
    }
  }, [token, user, loadIssues]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function handleLogin({ name, email, password, isRegister }) {
    setAuthBusy(true);
    setAuthError("");

    try {
      const endpoint = isRegister
        ? "/api/auth/register"
        : "/api/auth/login";
      const payload = isRegister
        ? { name, email, password }
        : { email, password };

      const response = await api.post(endpoint, payload);
      const receivedToken =
        response.data.token ||
        response.data.accessToken ||
        response.data.data?.token;

      if (!receivedToken) {
        throw new Error("The API did not return an authentication token.");
      }

      localStorage.setItem(TOKEN_KEY, receivedToken);
      setToken(receivedToken);

      const authenticated = await loadCurrentUser(receivedToken);
      if (!authenticated) {
        setAuthError("Could not load your account. Please sign in again.");
      }
    } catch (requestError) {
      setAuthError(getErrorMessage(requestError, "Authentication failed."));
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setIssues([]);
    setSelectedIssue(null);
    setShowReportForm(false);
    setError("");
    setSuccess("");
    setAuthError("");
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview("");
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function submitIssue(event) {
    event.preventDefault();

    setReportBusy(true);
    setImageUploading(false);
    setError("");
    setSuccess("");

    const coordinatesProvided =
      form.longitude.trim() !== "" || form.latitude.trim() !== "";

    if (
      coordinatesProvided &&
      (!form.longitude.trim() || !form.latitude.trim())
    ) {
      setError("Enter both longitude and latitude, or leave both blank.");
      setReportBusy(false);
      return;
    }

    let coordinates;

    if (coordinatesProvided) {
      const longitude = Number(form.longitude);
      const latitude = Number(form.latitude);

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        setError("Enter valid longitude and latitude coordinates.");
        setReportBusy(false);
        return;
      }

      coordinates = [longitude, latitude];
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      location: {
        address: form.address.trim(),
        ...(coordinates ? { coordinates } : {}),
      },
    };

    try {
      let imageUrl = "";

      if (imageFile) {
        setImageUploading(true);

        const uploadData = new FormData();
        uploadData.append("image", imageFile);

        const uploadResponse = await api.post(
          "/api/uploads",
          uploadData,
          { headers: authHeaders }
        );

        imageUrl = uploadResponse.data.imageUrl;

        if (!imageUrl) {
          throw new Error("Image upload did not return an image URL.");
        }
      }

      await api.post(
        "/api/issues",
        {
          ...payload,
          ...(imageUrl ? { imageUrl } : {}),
        },
        { headers: authHeaders }
      );

      setSuccess("Your issue has been reported successfully.");
      setShowReportForm(false);
      setForm({ ...EMPTY_FORM });
      setImageFile(null);
      setImagePreview("");

      await loadIssues();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to report issue."));
    } finally {
      setReportBusy(false);
      setImageUploading(false);
    }
  }

  async function updateIssueStatus(issueId, status, resolutionNote) {
    setError("");
    setSuccess("");

    const payload = {
      status,
      ...(resolutionNote ? { resolutionNote } : {}),
      ...(status === "resolved" ? { note: resolutionNote } : {}),
    };

    try {
      await api.patch(`/api/issues/${issueId}/status`, payload, {
        headers: authHeaders,
      });

      setSuccess("Issue status updated successfully.");
      await loadIssues();

      if (selectedIssue?._id === issueId) {
        await viewIssue(issueId);
      }
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Unable to update issue status."
      );
      setError(message);
      throw new Error(message);
    }
  }

  async function viewIssue(issueId) {
    setDetailLoading(true);
    setError("");

    try {
      const response = await api.get(`/api/issues/${issueId}`, {
        headers: authHeaders,
      });

      const issue =
        response.data.issue ||
        response.data.data?.issue ||
        response.data.data ||
        response.data;

      setSelectedIssue(issue);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to load issue details.")
      );
    } finally {
      setDetailLoading(false);
    }
  }

  const stats = useMemo(
    () => ({
      total: issues.length,
      reported: issues.filter((issue) => issue.status === "reported").length,
      inProgress: issues.filter((issue) => issue.status === "in-progress")
        .length,
      resolved: issues.filter((issue) => issue.status === "resolved").length,
    }),
    [issues]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading CivicPulse...
          </p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        busy={authBusy}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CivicPulse</h1>
              <p className="text-xs text-slate-500">
                Community Issue Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                {isAdmin ? "Administration" : "Citizen dashboard"}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {isAdmin
                  ? "Manage community issues."
                  : "Make your community better."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {isAdmin
                  ? "Review reported problems, monitor progress, and keep citizens informed."
                  : "Report local problems and track every update from submission to resolution."}
              </p>
            </div>

            {!isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowReportForm(true);
                }}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-400"
              >
                <Plus size={19} />
                Report an issue
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
              className="rounded p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total issues"
            value={stats.total}
            icon={FileText}
            description="Issues in the current view"
          />
          <StatCard
            label="Reported"
            value={stats.reported}
            icon={AlertCircle}
            description="Awaiting further action"
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            icon={Activity}
            description="Currently being addressed"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            description="Successfully resolved"
          />
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isAdmin ? "All reported issues" : "My reported issues"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? "Review reports and manage their status."
                  : "View your reports and follow their progress."}
              </p>
            </div>

            <button
              type="button"
              onClick={loadIssues}
              disabled={issuesLoading}
              className="flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
            >
              <Activity size={16} />
              {issuesLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={17} />
              Filters
            </div>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 sm:min-w-48"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 sm:min-w-48"
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            {(categoryFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("");
                  setStatusFilter("");
                }}
                className="text-left text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Clear filters
              </button>
            )}
          </div>

          {issuesLoading ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
              <p className="mt-4 text-sm text-slate-500">Loading issues...</p>
            </div>
          ) : issues.length ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {issues.map((issue) => (
                <IssueCard
                  key={issue._id}
                  issue={issue}
                  admin={isAdmin}
                  onUpdateStatus={updateIssueStatus}
                  onView={viewIssue}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FileText size={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No issues found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {categoryFilter || statusFilter
                  ? "Try changing your filters to see more issues."
                  : isAdmin
                    ? "No civic issues have been reported yet."
                    : "You haven't reported any issues yet. Submit your first report to get started."}
              </p>

              {!isAdmin && !categoryFilter && !statusFilter && (
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  <Plus size={17} />
                  Report an issue
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          CivicPulse · Community Issue Management
        </footer>
      </main>

      {showReportForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !reportBusy) {
              setShowReportForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  CIVIC REPORT
                </p>
                <h2
                  id="report-title"
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  Report an issue
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Provide enough information to help address the problem.
                </p>
              </div>
              <button
                type="button"
                disabled={reportBusy}
                onClick={() => setShowReportForm(false)}
                aria-label="Close report form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitIssue} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="issue-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Issue title
                </label>
                <input
                  id="issue-title"
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  required
                  maxLength={150}
                  placeholder="e.g. Large pothole near main road"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="issue-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="issue-description"
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  required
                  rows={4}
                  maxLength={5000}
                  placeholder="Describe the problem and its impact..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="issue-category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Category
                  </label>
                  <select
                    id="issue-category"
                    name="category"
                    value={form.category}
                    onChange={updateForm}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="issue-priority"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>
                  <select
                    id="issue-priority"
                    name="priority"
                    value={form.priority}
                    onChange={updateForm}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="issue-address"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Location / address
                </label>
                <input
                  id="issue-address"
                  name="address"
                  value={form.address}
                  onChange={updateForm}
                  required
                  maxLength={300}
                  placeholder="e.g. Main road, Pune"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="issue-image"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <ImagePlus size={17} />
                  Issue photo (optional)
                </label>
                <input
                  id="issue-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="block w-full rounded-xl border border-slate-200 p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-700"
                />
                <p className="mt-2 text-xs text-slate-500">
                  JPEG, PNG, or WebP. Maximum size: 5 MB.
                </p>

                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Selected issue preview"
                      className="max-h-64 w-full rounded-xl border border-slate-200 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        const input = document.getElementById("issue-image");
                        if (input) input.value = "";
                      }}
                      className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Coordinates{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Enter both values if available. Longitude comes first in the
                  API payload, followed by latitude.
                </p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="issue-longitude"
                      className="mb-2 block text-xs font-medium text-slate-600"
                    >
                      Longitude
                    </label>
                    <input
                      id="issue-longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={form.longitude}
                      onChange={updateForm}
                      placeholder="e.g. 73.8567"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="issue-latitude"
                      className="mb-2 block text-xs font-medium text-slate-600"
                    >
                      Latitude
                    </label>
                    <input
                      id="issue-latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={form.latitude}
                      onChange={updateForm}
                      placeholder="e.g. 18.5204"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={reportBusy}
                  onClick={() => setShowReportForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportBusy}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reportBusy ? (
                    <>
                      <Upload size={18} className="animate-pulse" />
                      {imageUploading
                        ? "Uploading image..."
                        : "Submitting report..."}
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Submit report
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="rounded-xl bg-white px-6 py-4 font-medium shadow-xl">
            Loading issue details...
          </div>
        </div>
      )}

      {selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}

