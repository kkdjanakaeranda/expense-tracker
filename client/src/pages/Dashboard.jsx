import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts";



function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [type,setType] = useState("expense");

  const token = localStorage.getItem("token");

    if (!token) {
    return <Navigate to="/" />;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

  const getExpenses = async () => {
    const res = await axios.get(
      `http://localhost:5000/expenses/${userId}`
    );

    setExpenses(res.data);
  };

  useEffect(() => {
    getExpenses();
  }, []);

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

  return (
    <div>
      <h1>Expense Dashboard</h1>

      <h2>
    Income: Rs. {totalIncome}
    </h2>


    <h2>
    Expense: Rs. {totalExpense}
    </h2>


    <h2>
    Balance: Rs. {balance}
    </h2>

    <div>


    <h2>Expense Categories</h2>


    <PieChart width={350} height={300}>

    <Pie

    data={categoryData}

    dataKey="value"

    nameKey="name"

    cx="50%"

    cy="50%"

    outerRadius={100}

    >

    {
    categoryData.map(
    (entry,index)=>(

    <Cell key={index}/>

    )
    )
    }


    </Pie>

    <Tooltip/>

    <Legend/>

    </PieChart>



    <h2>
    Income vs Expense
    </h2>


    <BarChart
    width={400}
    height={300}
    data={chartData}
    >


    <XAxis dataKey="name"/>

    <YAxis/>


    <Tooltip/>


    <Bar
    dataKey="amount"
    />


    </BarChart>


    </div>


    <select
    value={type}
    onChange={(e)=>setType(e.target.value)}
    >

    <option value="expense">
    Expense
    </option>

    <option value="income">
    Income
    </option>

    </select>

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={addExpense}>

    {editId ? "Update Expense" : "Add Expense"}

    </button>

      <hr />

      <h2>Expenses</h2>

      {expenses.map((expense)=>(
    <div key={expense.id}>

    <h4>{expense.category}</h4>
    <p>Rs. {expense.amount}</p>
    <p>{expense.description}</p>
    <button onClick={()=>editExpense(expense)}>
    Edit
    </button>


    <button onClick={()=>deleteExpense(expense.id)}>
    Delete
    </button>


    <hr/>

    </div>
    ))}
    </div>
  );
}

export default Dashboard;