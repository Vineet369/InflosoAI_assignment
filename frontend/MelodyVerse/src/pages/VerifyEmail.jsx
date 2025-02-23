import React, { useContext, useEffect } from 'react'
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  axios.defaults.withCredentials = true;
  const {backendUrl, isLoggedIn, userData, getUserData} = useContext(AppContent)
  const inputRefs = React.useRef([])

  const navigate = useNavigate()

  const handleInput = (e, index) => {
    if(e.target.value.length > 0 && index < inputRefs.current.length - 1){
      inputRefs.current[index + 1].focus();
    }
  }

  const handleDelete = (e, index) => {
    if(e.key === 'Backspace' && e.target.value === '' && index > 0){
      inputRefs.current[index - 1].focus();
    }
  }

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      const otpArray = inputRefs.current.map(e => e.value)
      const otp = otpArray.join('')

      const {data} = await axios.post(backendUrl + '/api/v1/users/verify-account', {otp})
      console.log(data)
      if(data.success){
        toast.success(data.message)
        getUserData()
        navigate('/')
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    isLoggedIn && userData && userData.isAccountVerified && navigate('/')
  }, [isLoggedIn, userData])

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-900 to-amber-600'>
      <img onClick={() => navigate('/')} src={"#"} alt='' className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' />
      <form 
      onSubmit={onSubmitHandler}
      className='bg-slate-900 bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg w-96 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>
          Email Verify Otp
        </h1>
        <p className='text-center mb-6 text-indigo-900'>Enter the 4-digit code sent to your email id</p>
        <div className='flex justify-between mb-8'>
          {Array(4).fill(0).map((_,index) => (
            <input 
            type='text' 
            maxLength='1' 
            key={index} required 
            className='w-12 h-12 bg-white/10 backdrop-blur-md text-white text-center text-xl rounded-md'
            ref={e => inputRefs.current[index] = e}
            onInput={(e) => handleInput(e, index)}
            onKeyDown={(e) => handleDelete(e, index)}
          />
          ))}
        </div>
        <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium'>Verify Email</button>
      </form>
       
    </div>
  )
}

export default VerifyEmail
