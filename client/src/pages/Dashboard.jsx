import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
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
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#14b8a6", "#3b82f6", "#8b5cf6"];

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatDate = (expense) => {
  const rawDate = expense.created_at || expense.date;

  if (!rawDate) {
    return "-";
  }

  return new Date(rawDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
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
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [type,setType] = useState("expense");

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user")) : null;
  const userId = user?.id;

  const getExpenses = useCallback(async () => {
    if (!userId) {
      return;
    }

    const res = await axios.get(
      `http://localhost:5000/expenses/${userId}`
    );

    setExpenses(res.data);
  }, [userId]);

  useEffect(() => {
    // Initial API synchronization for this dashboard data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getExpenses();
  }, [getExpenses]);

    if (!token) {
    return <Navigate to="/" />;
    }

  const addExpense = async()=>{


    if(editId){

        await axios.put(
            `http://localhost:5000/expense/${editId}`,
            {
                amount,
                category,
                description
            }
        );


        setEditId(null);


    }else{


        await axios.post(
            type === "expense"
            ?
            "http://localhost:5000/expense"
            :
            "http://localhost:5000/income",
            {
                user_id:userId,
                amount,
                category,
                description
            }
        );


    }


    setAmount("");

    setCategory("");

    setDescription("");

    getExpenses();


    };

  const deleteExpense = async(id)=>{

  await axios.delete(
    `http://localhost:5000/expense/${id}`
  );

  getExpenses();

};

const editExpense = (expense)=>{

    setEditId(expense.id);

    setAmount(expense.amount);

    setCategory(expense.category);

    setDescription(expense.description);

};

const totalIncome = expenses

.filter(item=>item.type==="income")

.reduce(
(sum,item)=>sum + Number(item.amount),
0
);


const totalExpense = expenses

.filter(item=>item.type==="expense")

.reduce(
(sum,item)=>sum + Number(item.amount),
0
);


const balance = totalIncome - totalExpense;

const categoryData = expenses
.filter(item=>item.type==="expense")
.reduce((acc,item)=>{

 const found = acc.find(
    x=>x.name===item.category
 );


 if(found){

    found.value += Number(item.amount);

 }else{

    acc.push({
        name:item.category,
        value:Number(item.amount)
    });

 }


 return acc;


},[]);



const chartData = [
{
 name:"Income",
 amount:totalIncome
},

{
 name:"Expense",
 amount:totalExpense
}

];


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
              <p className="hidden text-sm text-gray-500 sm:block">Modern finance dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.name && (
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Logged in as</p>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              </div>
            )}
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
        <section className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-gray-200">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-950">Financial Dashboard</h2>
            <p className="mt-1 text-gray-500">Track income, expenses, and balance at a glance.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Total Income" amount={totalIncome} icon={TrendingUp} tone="green" />
          <SummaryCard title="Total Expense" amount={totalExpense} icon={ReceiptText} tone="red" />
          <SummaryCard title="Current Balance" amount={balance} icon={DollarSign} tone="blue" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
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
                  onChange={(e)=>setType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </Field>

              <Field label="Amount" icon={BadgeDollarSign}>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </Field>

              <Field label="Category" icon={Tag}>
                <input
                  placeholder="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </Field>

              <Field label="Description" icon={FileText}>
                <input
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </Field>

              <button
                onClick={addExpense}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                {editId ? <Pencil className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                {editId ? "Update Transaction" : "Add Transaction"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-950">Expense Categories</h3>
                  <p className="text-sm text-gray-500">Category split by amount.</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                  <PieChart className="h-5 w-5" />
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={86}>
                      {categoryData.map((entry,index)=>(
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
                  <p className="text-sm text-gray-500">Quick performance comparison.</p>
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
              <h3 className="text-lg font-bold text-gray-950">Transactions</h3>
              <p className="text-sm text-gray-500">All income and expense records.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
              <ListChecks className="h-4 w-4" />
              {expenses.length} total
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-8 ring-sky-100">
                <Wallet className="h-9 w-9" />
              </div>
              <h4 className="text-xl font-bold text-gray-950">No transactions yet.</h4>
              <p className="mt-2 text-gray-500">Start by adding your first transaction.</p>
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
                  {expenses.map((expense)=>(
                    <tr key={expense.id} className="transition duration-200 hover:bg-sky-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-2 ${expense.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            {expense.type === "income" ? <TrendingUp className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
                          </div>
                          <span className="font-semibold text-gray-900">{expense.category}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{expense.description}</td>
                      <td className="px-5 py-4 font-bold text-gray-950">{formatCurrency(expense.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${expense.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {expense.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          {formatDate(expense)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={()=>editExpense(expense)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={()=>deleteExpense(expense.id)}
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
