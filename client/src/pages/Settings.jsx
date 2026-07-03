import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Filter,
  Globe2,
  KeyRound,
  ListChecks,
  LogOut,
  Mail,
  PlusCircle,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Tag,
  User,
  UserCircle,
  Wallet,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Salary", "Health", "Education", "Entertainment", "Other"];

const TIME_ZONE_OPTIONS = [
  "Asia/Colombo",
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney"
];

const getPreferredTimeZone = () => localStorage.getItem("preferredTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const getDateParts = (date = new Date(), timeZone = getPreferredTimeZone()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value,
    month: parts.find((part) => part.type === "month")?.value,
    day: parts.find((part) => part.type === "day")?.value
  };
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const escapeCsvValue = (value) => {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const getTransactionDate = (transaction) => transaction.transaction_date || transaction.created_at || transaction.date;

const toDateInputValue = (rawDate, timeZone = getPreferredTimeZone()) => {
  if (!rawDate) {
    return "";
  }

  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const { year, month, day } = getDateParts(date, timeZone);

  return `${year}-${month}-${day}`;
};

const formatDate = (transaction, timeZone = getPreferredTimeZone()) => {
  const rawDate = getTransactionDate(transaction);

  if (!rawDate) {
    return "-";
  }

  return new Date(rawDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone
  });
};

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionHeader({ title, subtitle, icon: Icon, tone = "sky" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600"
  };

  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-gray-950">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className={`rounded-xl p-3 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-gray-950">{value}</p>
    </div>
  );
}

function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = token ? JSON.parse(localStorage.getItem("user")) : null;

  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(storedUser);
  const [profileName, setProfileName] = useState(storedUser?.name || "");
  const [profileEmail, setProfileEmail] = useState(storedUser?.email || "");
  const [customCategories, setCustomCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState(getPreferredTimeZone());
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`
    }
  }), [token]);

  const customCategoryKey = storedUser?.id ? `customCategories:${storedUser.id}` : "customCategories";
  const filterKey = storedUser?.id ? `settingsFilters:${storedUser.id}` : "settingsFilters";

  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
      return true;
    }

    return false;
  }, [navigate]);

  useEffect(() => {
    const savedCategories = JSON.parse(localStorage.getItem(customCategoryKey) || "[]");
    const savedFilters = JSON.parse(localStorage.getItem(filterKey) || "{}");

    setCustomCategories(savedCategories);
    setCategoryFilter(savedFilters.category || "");
    setStartDate(savedFilters.startDate || "");
    setEndDate(savedFilters.endDate || "");
  }, [customCategoryKey, filterKey]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadSettingsData = async () => {
      try {
        setIsLoading(true);
        const [transactionsRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/transactions`, authHeaders),
          axios.get(`${API_URL}/profile`, authHeaders)
        ]);

        setTransactions(transactionsRes.data);
        setProfile(profileRes.data);
        setProfileName(profileRes.data.name || "");
        setProfileEmail(profileRes.data.email || "");
        localStorage.setItem("user", JSON.stringify(profileRes.data));
      } catch (error) {
        if (!handleAuthError(error)) {
          setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Could not load settings.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettingsData();
  }, [authHeaders, handleAuthError, token]);

  if (!token) {
    return <Navigate to="/" />;
  }

  const savedCategories = transactions.map((item) => item.category).filter(Boolean);
  const allCategoryOptions = [...new Set([...DEFAULT_CATEGORIES, ...customCategories, ...savedCategories])];

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = toDateInputValue(getTransactionDate(transaction), selectedTimeZone);
    const matchesCategory = categoryFilter ? transaction.category === categoryFilter : true;
    const matchesStartDate = startDate && transactionDate ? transactionDate >= startDate : true;
    const matchesEndDate = endDate && transactionDate ? transactionDate <= endDate : true;

    return matchesCategory && matchesStartDate && matchesEndDate;
  });

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const filteredIncome = filteredTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const filteredExpense = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const filteredTotal = filteredTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const saveFilters = (nextFilters) => {
    localStorage.setItem(filterKey, JSON.stringify(nextFilters));
  };

  const updateCategoryFilter = (value) => {
    setCategoryFilter(value);
    saveFilters({ category: value, startDate, endDate });
  };

  const updateStartDate = (value) => {
    setStartDate(value);
    saveFilters({ category: categoryFilter, startDate: value, endDate });
  };

  const updateEndDate = (value) => {
    setEndDate(value);
    saveFilters({ category: categoryFilter, startDate, endDate: value });
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
    saveFilters({ category: "", startDate: "", endDate: "" });
    setErrorMessage("");
    setMessage("Filters cleared.");
  };

  const changeTimeZone = (value) => {
    setSelectedTimeZone(value);
    localStorage.setItem("preferredTimezone", value);
    setErrorMessage("");
    setMessage("Timezone updated.");
  };

  const exportHistory = () => {
    if (filteredTransactions.length === 0) {
      setMessage("");
      setErrorMessage("No transactions to export.");
      return;
    }

    const headers = ["Category", "Description", "Amount", "Type", "Date"];
    const rows = filteredTransactions.map((transaction) => [
      transaction.category,
      transaction.description || "",
      transaction.amount,
      transaction.type,
      formatDate(transaction, selectedTimeZone)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "personal-transaction-history.csv";
    link.click();
    URL.revokeObjectURL(url);
    setErrorMessage("");
    setMessage("Transaction history exported.");
  };

  const addCustomCategory = () => {
    const trimmedCategory = newCategory.trim();

    if (!trimmedCategory) {
      setMessage("");
      setErrorMessage("Enter a category name.");
      return;
    }

    if (!customCategories.includes(trimmedCategory)) {
      const nextCategories = [...customCategories, trimmedCategory];
      setCustomCategories(nextCategories);
      localStorage.setItem(customCategoryKey, JSON.stringify(nextCategories));
    }

    setNewCategory("");
    setErrorMessage("");
    setMessage("Category added.");
  };

  const saveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      setMessage("");
      setErrorMessage("Name and email are required.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setMessage("");
      setErrorMessage("");

      const res = await axios.put(
        `${API_URL}/profile`,
        {
          name: profileName.trim(),
          email: profileEmail.trim()
        },
        authHeaders
      );

      setProfile(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage("Profile updated.");
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Could not update profile.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("");
      setErrorMessage("Complete all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("");
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      setMessage("");
      setErrorMessage("");

      await axios.put(
        `${API_URL}/profile/password`,
        {
          currentPassword,
          newPassword
        },
        authHeaders
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed.");
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Could not change password.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">Expense Tracker</h1>
              <p className="hidden text-sm text-gray-500 sm:block">Profile settings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-gray-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-md">
                <UserCircle className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </div>
                <h2 className="truncate text-3xl font-bold tracking-tight text-gray-950">{profile?.name || "Profile Settings"}</h2>
                <p className="mt-1 truncate text-gray-500">{profile?.email || "Manage your account and history."}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <StatBox label="Transactions" value={transactions.length} />
              <StatBox label="Income" value={formatCurrency(totalIncome)} />
              <StatBox label="Expenses" value={formatCurrency(totalExpense)} />
            </div>
          </div>
        </section>

        {(message || errorMessage) && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${errorMessage ? "border-rose-100 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
            {errorMessage || message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionHeader title="Account Details" subtitle="Update your name and email." icon={User} tone="violet" />

              <div className="space-y-4">
                <Field label="Name" icon={User}>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
                <Field label="Email" icon={Mail}>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
                <Field label="Timezone" icon={Globe2}>
                  <select
                    value={selectedTimeZone}
                    onChange={(e) => changeTimeZone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  >
                    {!TIME_ZONE_OPTIONS.includes(selectedTimeZone) && (
                      <option value={selectedTimeZone}>{selectedTimeZone}</option>
                    )}
                    {TIME_ZONE_OPTIONS.map((timeZone) => (
                      <option key={timeZone} value={timeZone}>
                        {timeZone}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  onClick={saveProfile}
                  disabled={isSavingProfile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-300"
                >
                  <Save className="h-5 w-5" />
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionHeader title="Security" subtitle="Change your password." icon={ShieldCheck} tone="emerald" />

              <div className="space-y-4">
                <Field label="Current Password" icon={KeyRound}>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
                <Field label="New Password" icon={KeyRound}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
                <Field label="Confirm Password" icon={KeyRound}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
                <button
                  onClick={changePassword}
                  disabled={isChangingPassword}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <KeyRound className="h-5 w-5" />
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
          </div>

        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionHeader title="Categories" subtitle="Add and reuse categories." icon={Tag} tone="amber" />

              <div className="flex gap-2">
                <input
                  placeholder="Add new category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
                <button
                  onClick={addCustomCategory}
                  className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gray-950 text-white transition hover:bg-gray-800"
                  aria-label="Add category"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                {allCategoryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => updateCategoryFilter(option)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${categoryFilter === option ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-sky-100 hover:text-sky-700"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionHeader title="History Filters" subtitle="Filter the personal history below." icon={Filter} tone="sky" />

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Category" icon={Tag}>
                  <select
                    value={categoryFilter}
                    onChange={(e) => updateCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">All categories</option>
                    {allCategoryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Start Date" icon={CalendarDays}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => updateStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
                <Field label="End Date" icon={CalendarDays}>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => updateEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm font-semibold text-gray-500">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 xl:flex-row xl:items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-950">Personal Transaction History</h3>
                  <p className="text-sm text-gray-500">Full history filtered by category and date range.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                      <span className="block text-xs uppercase tracking-wide text-gray-400">Rows</span>
                      {filteredTransactions.length}
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <span className="block text-xs uppercase tracking-wide text-emerald-500">Income</span>
                      {formatCurrency(filteredIncome)}
                    </div>
                    <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                      <span className="block text-xs uppercase tracking-wide text-rose-500">Expenses</span>
                      {formatCurrency(filteredExpense)}
                    </div>
                    <div className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                      <span className="block text-xs uppercase tracking-wide text-sky-500">Total</span>
                      {formatCurrency(filteredTotal)}
                    </div>
                  </div>
                  <button
                    onClick={exportHistory}
                    disabled={filteredTransactions.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="px-6 py-16 text-center font-semibold text-gray-500">Loading transactions...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-8 ring-sky-100">
                    <Wallet className="h-9 w-9" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-950">No transactions found.</h4>
                  <p className="mt-2 text-gray-500">Try changing the category or date range.</p>
                </div>
              ) : (
                <>
                <div className="space-y-3 p-4 md:hidden">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-950">{transaction.category}</p>
                          <p className="mt-1 truncate text-sm text-gray-500">{transaction.description || "-"}</p>
                        </div>
                        <span className={`flex-none rounded-full px-3 py-1 text-xs font-bold capitalize ${transaction.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {transaction.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Amount</p>
                          <p className="mt-1 font-bold text-gray-950">{formatCurrency(transaction.amount)}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Date</p>
                          <p className="mt-1 font-bold text-gray-950">{formatDate(transaction, selectedTimeZone)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Description</th>
                        <th className="px-5 py-4">Amount</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="transition duration-200 hover:bg-sky-50/60">
                          <td className="px-5 py-4 font-semibold text-gray-900">{transaction.category}</td>
                          <td className="px-5 py-4 text-gray-600">{transaction.description || "-"}</td>
                          <td className="px-5 py-4 font-bold text-gray-950">{formatCurrency(transaction.amount)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${transaction.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              {formatDate(transaction, selectedTimeZone)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
        </section>
      </main>
    </div>
  );
}

export default Settings;
