import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
    const navigate = useNavigate()

    const {backendUrl, setIsLoggedIn, getUserData} = useContext(AppContent)

    const [state, setState] = useState('Sign Up')
    const [userName, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [signUpPassword, setSignUpPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false);
    const [terms, setTerms] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMatch, setPasswordMatch] = useState(true); 
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const sendVerificationOtp = async () => {
      try {
        // axios.defaults.withCredentials = true;
        const {data} = await axios.post(backendUrl + '/api/v1/users/send-verify-otp')

        if(data.success){
          navigate('/verify-email')
          toast.success(data.message)
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            if(!passwordMatch){
                toast.error('Password mismatch')
                return
            }
            axios.defaults.withCredentials = true
            if(state === 'Sign Up') {
                const {data} = await axios.post(backendUrl + '/api/v1/users/register', {userName, email, signUpPassword, rememberMe})
                if(data.success){
                    // setState('Login')
                    setEmail('')  
                    setPassword('')
                    getUserData()
                    // setIsLoggedIn(true)
                    sendVerificationOtp()
                
                }else{
                    toast.error(data.message)
                }
            }else{
                const {data} = await axios.post(backendUrl + '/api/v1/users/login', {email, password, rememberMe})
                console.log(data)
                if(data.success && data.data.loggedInUser && data.data.loggedInUser.isAccountVerified){
                    setIsLoggedIn(true)
                    navigate('/')
                } else if(data.success && data.data.loggedInUser && !data.data.loggedInUser.isAccountVerified){
                    setIsLoggedIn(true)
                    toast.warning('Verify your email id')
                    sendVerificationOtp()
                }else{
                    toast.error(data.response?.data?.message || "Something went wrong")
                }
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || "Something went wrong")
        }
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setSignUpPassword(newPassword);
    
        let error = '';
        if (newPassword.length < 8) {
          error = 'Password must be at least 8 characters.';
        } else if (!/[A-Z]/.test(newPassword)) {
          error = 'Password must contain at least one uppercase letter.';
        } else if (!/[a-z]/.test(newPassword)) {
          error = 'Password must contain at least one lowercase letter.';
        } else if (!/[0-9]/.test(newPassword)) {
          error = 'Password must contain at least one number.';
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
          error = 'Password must contain at least one special character.';
        }
      
        setPasswordError(error);
      };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-900 to-amber-600'>
      <img onClick={() => navigate('/')} src={"#"} alt='' className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'/>
        <div className='bg-slate-900 bg-white/30 backdrop-blur-md p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm'>
        <h2 className='text-3xl font-semibold text-slate-700 text-center mb-3'>
            {state === 'Sign Up' ? 'Create your account' : 'Login to your account!'}
        </h2>

        <p className='text-center text-sm text-slate-700 mb-6'>{state === 'Sign Up' ? 'Create your account' : 'Login to your account!'}</p>

        <form onSubmit={onSubmitHandler}>
            {state === 'Sign Up' && (
                <div className='mb-4 flex bg-white/30 backdrop-blur-md items-center gap-3 w-full px-5 py-2.5 rounded-full'>
                    <input 
                    onChange={e => setName(e.target.value)} 
                    value={userName} 
                    className='bg-transparent text-indigo-900 outline-none' 
                    type='text' 
                    placeholder='Full Name' 
                    required />
                </div>
            )}

            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md'>
                <input onChange={e => setEmail(e.target.value)} 
                value={email} 
                className='bg-transparent text-indigo-900 outline-none' 
                type='email' 
                placeholder='Email Id' 
                required />
            </div>

{state === 'Login' && (
            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md'>
                <input 
                 onChange={e => {
                    setPassword(e.target.value); 
                }}
                value={password} 
                className='bg-transparent text-indigo-900 outline-none' 
                type={showPassword ? 'text' : 'password'}
                placeholder='Password' 
                required />
                <button className='pl-12 text-slate-700' type="button" onClick={togglePasswordVisibility}>
                    {showPassword ? 'Hide' : 'Show'}
                </button>
            </div>
)}
            
{state === 'Sign Up' && (
               <div>
                <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md'>
                <input 
                 onChange={e => {handlePasswordChange(e);
                    setSignUpPassword(e.target.value);
                    setPasswordMatch(e.target.value === confirmPassword); 
                }}
                value={signUpPassword} 
                className='bg-transparent text-indigo-900 outline-none' 
                type={showPassword ? 'text' : 'password'} 
                placeholder='Password' 
                required />
                <button className='pl-12 text-slate-700' type="button" onClick={togglePasswordVisibility}>
                    {showPassword ? 'Hide' : 'Show'}
                </button>
                </div>

                <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md'>
                <input 
                onChange={e => {
                    setConfirmPassword(e.target.value);
                    setPasswordMatch(signUpPassword === e.target.value);   
                }}
                value={confirmPassword} 
                className='bg-transparent text-indigo-900 outline-none' 
                type={showPassword ? 'text' : 'password'}
                placeholder='Confirm Password' 
                required />
                <button className='pl-12 text-slate-700' type="button" onClick={togglePasswordVisibility}>
                    {showPassword ? 'Hide' : 'Show'}
                </button>
                </div>
              </div> 

)}

{state === 'Sign Up' && passwordError && <p className='text-red-900'>{passwordError}</p>}
            {!passwordMatch && state === 'Sign Up' && (
                <p className='text-red-900'>Passwords do not match.</p>
)}

            <label className='mr-4 text-slate-700'>
            <input 
                className='border-none mr-2 mb-4 '
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}  
            />
            Remember me
            </label>
{state === 'Sign Up' && (
            <label className='text-slate-700'>
            <input 
                className='border-none mr-2 mb-4 text-indigo-900'
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                required  
            />
            I agree to the terms
            </label>
)}
            <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium'>{state}</button>
            <p onClick={() => navigate('/reset-password')} className='mb-4 mt-4 text-center text-slate-700 cursor-pointer'>Forgot Password?</p>
        </form>
        
{ state === 'Sign Up' ? (
            <p className='text-slate-700 text-center text-xs mt-4'>Already have an account?{' '}
            <span onClick={() => setState('Login')} className='text-blue-900 cursor-pointer underline'>Login here</span>
        </p>
) : (
            <p className='text-slate-700 text-center text-xs mt-4'>Do not have an account?{' '}
            <span onClick={() => setState('Sign Up')} className='text-blue-900 cursor-pointer underline'>Sign Up</span>
        </p>
)}
        
        
      </div>
    </div>
  )
}

export default Login
