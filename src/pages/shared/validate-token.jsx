import React, { useContext, useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";

import {Store, save, get, remove} from "../../utils/local-store.js"
import {validateToken, getUser} from "../../endpoints/api.js"
import {GetUserRequest} from "../../endpoints/request.js";
import { UserContext } from "../../app.jsx";

export function Authenticator({child}) {
    const navigate = useNavigate();
    const [finished, setFinished] = useState(false);
    const {user, setUser} = useContext(UserContext);

    function forceLogOut() {
        setUser(()=>undefined);
        navigate('/login');
    }

    async function checkPassports() {
        try {
            const auth = await validateToken()
            if (user == null) {
                const user = await getUser(new GetUserRequest(auth.userID));
                if(user) setUser(()=>user);
            }
            setFinished(true);
        } catch {
            forceLogOut()
        }
    }

    useEffect(()=>{
        checkPassports()
    }, []);
    
    if(!finished) return (null);
    
    return (<>{child}</>);
}