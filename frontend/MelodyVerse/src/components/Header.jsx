import React from 'react'
import { SiNeteasecloudmusic } from "react-icons/si";

const Header = () => {
  return (
    <div className='flex flex-col items-center mt-20 px-8 py-8 rounded-[1vw] text-center text-amber-100 bg-white/10 backdrop-blur-md'>
        <SiNeteasecloudmusic size={140} className='m-5'/>
      <h1 className='flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2'>MelodyVerse
      </h1>

      <h2 className='text-3xl sm:text-5xl font-semibold mb-4'>Welcome to MelodyVerse</h2>
      <p className='mb-8 max-w-md'>Let's start with a quick product tour</p>
      <button className='border border-gray-500 rounded-full px-8 py-2.5 hover:bg-gray-100 transition-all'>Get Started</button>
    </div>
  )
}

export default Header
