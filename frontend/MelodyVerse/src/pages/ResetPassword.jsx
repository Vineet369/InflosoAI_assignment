import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {

  const {backendUrl} = useContext(AppContent)
  axios.defaults.withCredentials = true

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isEmailSent, setIsEmailSent] = useState('')
  const [otp, setOtp] = useState(0)
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)

  const inputRefs = React.useRef([])
  
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

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      const {data} = await axios.post(backendUrl + '/api/v1/users/send-reset-otp', {email})
      data.success ? toast.success(data.message) : toast.error(data.message)
      data.success && setIsEmailSent(true)

    } catch (error) {
      toast.error(error.message)
    }
  }

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map(e => e.value)
    setOtp(otpArray.join(''))
    setIsOtpSubmitted(true)
  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try {
      const {data} = await axios.post(backendUrl + '/api/v1/users/change-password', {email, otp, newPassword})
      data.success ? toast.success(data.message) : toast.error(data.message)
      data.success && navigate('/login')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-900 to-amber-600'>
      <img onClick={() => navigate('/')} src={"#"} alt='' className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' />
 
{!isEmailSent && 

      <form onSubmit={onSubmitEmail} className='bg-slate-900 bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg w-96 text-sm'> 
      <h1 className='text-white text-2xl font-semibold text-center mb-4'>
          Reset Password
        </h1>
        <p className='text-center mb-6 text-indigo-900'>
          Emter your registered email address
          </p> 
        <div className='mb-4 flex bg-white/30 backdrop-blur-md items-center gap-3 w-full px-5 py-2.5 rounded-full'>
          <img src={"#"} alt='' />
          <input 
            type='email' 
            placeholder='Email Id'
            className='bg-transparent text-indigo-900 outline-none'
            value={email}
            onChange={e => setEmail(e.target.value)} required
          />
        </div>
        <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium'>Submit</button>
      </form>

}

{!isOtpSubmitted && isEmailSent &&

      <form 
      onSubmit={onSubmitOtp}
      className='bg-slate-900 bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg w-96 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>
          Reset password Otp
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
        <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium'>Submit</button>
      </form>

}

{isOtpSubmitted && isEmailSent &&

      <form onSubmit={onSubmitNewPassword} className='bg-slate-900 bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg w-96 text-sm'> 
      <h1 className='text-white text-2xl font-semibold text-center mb-4'>
          New Password
        </h1>
        <p className='text-center mb-6 text-indigo-900'>
          Emter the new password below
          </p> 
        <div className='mb-4 flex bg-white/30 backdrop-blur-md items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
          <img src={"#"} alt='' />
          <input 
            type='password' 
            placeholder='Password'
            className='bg-transparent text-indigo-900 outline-none'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)} required
          />
        </div>
        <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium'>Submit</button>
      </form>
}
    </div>
  )
}

export default ResetPassword
