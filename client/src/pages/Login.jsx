import { useState } from "react";
import axios from "axios";


function Login(){


const [email,setEmail]=useState("");
const [password,setPassword]=useState("");



const login = async()=>{


    try{

        const response = await axios.post(

            "http://localhost:5000/login",

            {
                email,
                password
            }

        );


        localStorage.setItem(
            "token",
            response.data.token
        );


        alert("Login successful");


    }catch(error){

        console.log(error);

    }

}



return(

<div>

<h2>Login</h2>


<input

placeholder="Email"

onChange={(e)=>setEmail(e.target.value)}

/>


<input

placeholder="Password"

type="password"

onChange={(e)=>setPassword(e.target.value)}

/>


<button onClick={login}>

Login

</button>


</div>


)


}


export default Login;