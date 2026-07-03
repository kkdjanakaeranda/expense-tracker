import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts";
import {
  BadgeDollarSign,
  CalendarDays,
  DollarSign,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Pencil,
  PieChart,
  PlusCircle,
  ReceiptText,
  Settings,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const COLORS = ["#ef4444", "#f97316", "#eab308", "#14b8a6", "#3b82f6", "#8b5cf6"];

const DEFAULT_CATEGORIES = {
  expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"],
  income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"]
};

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

const currentMonthValue = (timeZone = getPreferredTimeZone()) => {
  const { year, month } = getDateParts(new Date(), timeZone);

  return `${year}-${month}`;
};

const currentDateValue = (timeZone = getPreferredTimeZone()) => {
  const { year, month, day } = getDateParts(new Date(), timeZone);

  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

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

const toMonthInputValue = (rawDate, timeZone = getPreferredTimeZone()) => toDateInputValue(rawDate, timeZone).slice(0, 7);

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

const isSameMonth = (transaction, selectedMonth, timeZone = getPreferredTimeZone()) => {
  const rawDate = getTransactionDate(transaction);

  if (!rawDate || !selectedMonth) {
    return false;
  }

  return toMonthInputValue(rawDate, timeZone) === selectedMonth;
};

function SummaryCard({ title, amount, icon: Icon, tone }) {
  const tones = {
    green: {
      card: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      text: "text-emerald-700"
    },
    red: {
      card: "border-rose-100 bg-gradient-to-br from-white to-rose-50",
      icon: "bg-rose-100 text-rose-600",
      text: "text-rose-700"
    },
    blue: {
      card: "border-sky-100 bg-gradient-to-br from-white to-sky-50",
      icon: "bg-sky-100 text-sky-600",
      text: "text-sky-700"
    }
  };

  return (
    <div className={`group rounded-xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${tones[tone].card}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${tones[tone].text}`}>{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{formatCurrency(amount)}</p>
        </div>
        <div className={`rounded-xl p-3 transition duration-300 group-hover:scale-110 ${tones[tone].icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

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

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = token ? JSON.parse(localStorage.getItem("user")) : null;
  const preferredTimeZone = getPreferredTimeZone();

  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(currentDateValue(preferredTimeZone));
  const [editId, setEditId] = useState(null);
  const [type, setType] = useState("expense");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue(preferredTimeZone));
  const [customCategories, setCustomCategories] = useState([]);
  const [profile, setProfile] = useState(storedUser);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`
    }
  }), [token]);

  const customCategoryKey = storedUser?.id ? `customCategories:${storedUser.id}` : "customCategories";

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(customCategoryKey) || "[]");
    setCustomCategories(saved);
  }, [customCategoryKey]);

  const saveCustomCategories = useCallback((categories) => {
    setCustomCategories(categories);
    localStorage.setItem(customCategoryKey, JSON.stringify(categories));
  }, [customCategoryKey]);

  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
      return true;
    }

    return false;
  }, [navigate]);

  const getTransactions = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/transactions`, authHeaders);
      setTransactions(res.data);
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Could not load transactions.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, handleAuthError, token]);

  const getProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/profile`, authHeaders);
      setProfile(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      handleAuthError(error);
    }
  }, [authHeaders, handleAuthError, token]);

  useEffect(() => {
    getTransactions();
    getProfile();
  }, [getTransactions, getProfile]);

  if (!token) {
    return <Navigate to="/" />;
  }

  const savedCategories = transactions.map((item) => item.category).filter(Boolean);
  const categoryOptions = [...new Set([...DEFAULT_CATEGORIES[type], ...customCategories, ...savedCategories])];
  const selectedCategoryValue = categoryOptions.includes(category) ? category : category ? "__custom__" : "";

  const monthlyTransactions = transactions.filter((item) => isSameMonth(item, selectedMonth, preferredTimeZone));

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthlyExpense = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  const categoryData = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      const found = acc.find((x) => x.name === item.category);

      if (found) {
        found.value += Number(item.amount);
      } else {
        acc.push({
          name: item.category,
          value: Number(item.amount)
        });
      }

      return acc;
    }, []);

  const topExpenseCategory = categoryData.length
    ? [...categoryData].sort((a, b) => b.value - a.value)[0]
    : null;

  const chartData = [
    {
      name: "Income",
      amount: monthlyIncome
    },
    {
      name: "Expense",
      amount: monthlyExpense
    }
  ];

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setTransactionDate(currentDateValue(preferredTimeZone));
    setEditId(null);
    setType("expense");
  };

  const saveTransaction = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0 || !category.trim() || !transactionDate) {
      setErrorMessage("Please enter a valid amount, category, and date.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setMessage("");

      if (editId) {
        await axios.put(
          `${API_URL}/expense/${editId}`,
          {
            amount: numericAmount,
            category,
            description,
            transaction_date: transactionDate
          },
          authHeaders
        );
        setMessage("Transaction updated.");
      } else {
        await axios.post(
          type === "expense" ? `${API_URL}/expense` : `${API_URL}/income`,
          {
            amount: numericAmount,
            category,
            description,
            transaction_date: transactionDate
          },
          authHeaders
        );
        setMessage("Transaction added.");
      }

      if (category && !customCategories.includes(category) && !DEFAULT_CATEGORIES.expense.includes(category) && !DEFAULT_CATEGORIES.income.includes(category)) {
        saveCustomCategories([...customCategories, category]);
      }

      resetForm();
      getTransactions();
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Could not save transaction.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransaction = async (id) => {
    const confirmed = window.confirm("Delete this transaction?");

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");
      await axios.delete(`${API_URL}/expense/${id}`, authHeaders);
      setMessage("Transaction deleted.");
      getTransactions();
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Could not delete transaction.");
      }
    }
  };

  const editTransaction = (transaction) => {
    setEditId(transaction.id);
    setType(transaction.type || "expense");
    setAmount(transaction.amount);
    setCategory(transaction.category);
    setDescription(transaction.description || "");
    setTransactionDate(toDateInputValue(getTransactionDate(transaction), preferredTimeZone) || currentDateValue(preferredTimeZone));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              <p className="hidden text-sm text-gray-500 sm:block">Month-by-month personal finance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile?.name && (
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Logged in as</p>
                <p className="text-sm font-semibold text-gray-800">{profile.name}</p>
              </div>
            )}
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
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
        <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-gray-200">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-950">Monthly Overview</h2>
            <p className="mt-1 text-gray-500">Select a month to view income, expenses, balance, and transaction history.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-1">
            <Field label="Month" icon={CalendarDays}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </Field>
          </div>
        </section>

        {(message || errorMessage) && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${errorMessage ? "border-rose-100 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
            {errorMessage || message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Total Income This Month" amount={monthlyIncome} icon={TrendingUp} tone="green" />
          <SummaryCard title="Total Expenses This Month" amount={monthlyExpense} icon={ReceiptText} tone="red" />
          <SummaryCard title="Current Balance" amount={monthlyBalance} icon={DollarSign} tone="blue" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-950">{editId ? "Update Transaction" : "Add Transaction"}</h3>
                  <p className="text-sm text-gray-500">Record income or expenses.</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                  <PlusCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Transaction Type" icon={Wallet}>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={Boolean(editId)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-gray-100"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </Field>

                <Field label="Amount" icon={BadgeDollarSign}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>

                <Field label="Category" icon={Tag}>
                  <div className="space-y-3">
                    <select
                      value={selectedCategoryValue}
                      onChange={(e) => setCategory(e.target.value === "__custom__" ? "" : e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      <option value="__custom__">Add custom category</option>
                    </select>

                    {selectedCategoryValue === "__custom__" && (
                      <input
                        placeholder="New category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                      />
                    )}
                  </div>
                </Field>

                <Field label="Description" icon={FileText}>
                  <input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>

                <Field label="Transaction Date" icon={CalendarDays}>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>

                <div className="flex gap-3">
                  <button
                    onClick={saveTransaction}
                    disabled={isSaving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-300"
                  >
                    {editId ? <Pencil className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                    {isSaving ? "Saving..." : editId ? "Update" : "Add"}
                  </button>
                  {editId && (
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                      aria-label="Cancel edit"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-950">Expense Summary</h3>
                  <p className="text-sm text-gray-500">
                    {topExpenseCategory ? `${topExpenseCategory.name}: ${formatCurrency(topExpenseCategory.value)}` : "No expenses this month."}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                  <PieChart className="h-5 w-5" />
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={86}>
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name || index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-950">Income vs Expense</h3>
                  <p className="text-sm text-gray-500">Selected month comparison.</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Personal Transaction History</h3>
              <p className="text-sm text-gray-500">Only transactions from the selected dashboard month.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
              <ListChecks className="h-4 w-4" />
              {monthlyTransactions.length} shown
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center font-semibold text-gray-500">Loading transactions...</div>
          ) : monthlyTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-8 ring-sky-100">
                <Wallet className="h-9 w-9" />
              </div>
              <h4 className="text-xl font-bold text-gray-950">No transactions found.</h4>
              <p className="mt-2 text-gray-500">Try another month or add a new transaction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyTransactions.map((transaction) => (
                    <tr key={transaction.id} className="transition duration-200 hover:bg-sky-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-2 ${transaction.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            {transaction.type === "income" ? <TrendingUp className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
                          </div>
                          <span className="font-semibold text-gray-900">{transaction.category}</span>
                        </div>
                      </td>
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
                          {formatDate(transaction)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editTransaction(transaction)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
