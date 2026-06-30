import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User, Wallet } from "lucide-react";

function Register(){

    const [name,setName] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [showPassword,setShowPassword] = useState(false);
    const [errorMessage,setErrorMessage] = useState("");


    const register = async()=>{

        try{
            setErrorMessage("");

            const response = await axios.post(
                "http://localhost:5000/register",
                {
                    name,
                    email,
                    password
                }
            );


            alert(response.data.message);


        }catch(error){

            console.log(error);
            setErrorMessage(error.response?.data?.message || error.response?.data?.error || "Registration failed. Please try again.");

        }

    };


    return(
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-900 px-4 py-8 text-gray-950">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
                <section className="hidden text-white lg:block">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-xl ring-1 ring-white/20 backdrop-blur">
                        <Wallet className="h-8 w-8" />
                    </div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Expense Tracker</p>
                    <h1 className="max-w-xl text-5xl font-bold tracking-tight">Manage your money smarter</h1>
                    <p className="mt-5 max-w-lg text-lg leading-8 text-slate-200">
                        Track expenses, monitor income, and understand your financial habits.
                    </p>
                </section>

                <section className="mx-auto w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-xl sm:p-8">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg">
                            <Wallet className="h-7 w-7" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-950">Create Account</h2>
                        <p className="mt-2 text-sm text-gray-500">Start tracking your finances today</p>
                    </div>

                    {errorMessage && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-gray-700">Name</span>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                placeholder="Name"
                                onChange={(e)=>setName(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-gray-700">Email</span>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                placeholder="Email"
                                onChange={(e)=>setEmail(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-gray-700">Password</span>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                onChange={(e)=>setPassword(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-12 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                />
                                <button
                                type="button"
                                onClick={()=>setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </label>

                        <button
                        onClick={register}
                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-sky-600 to-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30 focus:outline-none focus:ring-4 focus:ring-sky-200"
                        >
                            Create Account
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/" className="font-semibold text-sky-700 transition hover:text-emerald-600">Login</Link>
                    </p>
                </section>
            </div>

        </div>
    )

}

export default Register;
