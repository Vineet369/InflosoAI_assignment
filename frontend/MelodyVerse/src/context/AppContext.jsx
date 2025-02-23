import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContent = createContext()

export const AppContextProvider = (props) => {

    axios.defaults.withCredentials = true

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(false)

    const getAuthState = async () => {
        try {
            const {data} = await axios.post(backendUrl + '/api/v1/users/is-auth')
            if(data.success){
                setIsLoggedIn(true)
                getUserData()
            }
        } catch (error) {
            // toast.error(error.response.data)
        }
    }
    
    const getUserData = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/v1/users/current-user')
                data.success ? setUserData(data.data) : toast.error(data.message)
                console.log(data.data)
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getAuthState()
    }, [])

    const value = {
        backendUrl,
        isLoggedIn, setIsLoggedIn,
        userData, setUserData,
        getUserData
    }

    return (
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>
    )
}