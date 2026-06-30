import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";



function Register(){

    const [name,setName] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");


    const register = async()=>{

        try{

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

        }

    };


    return(
        <div>

            <h2>Register</h2>


            <input
            placeholder="Name"
            onChange={(e)=>setName(e.target.value)}
            />


            <input
            placeholder="Email"
            onChange={(e)=>setEmail(e.target.value)}
            />


            <input
            placeholder="Password"
            type="password"
            onChange={(e)=>setPassword(e.target.value)}
            />


            <button onClick={register}>
                Register
            </button>

            <p>
            Already have an account?
            <Link to="/"> Login</Link>
            </p>

        </div>
    )

}

export default Register;