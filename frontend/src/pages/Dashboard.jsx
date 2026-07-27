import Sidebar from '@/components/Sidebar'
import React from 'react'
import { Outlet } from 'react-router-dom'

function Dashboard() {
  return (
    <div className='flex w-full min-h-screen'>
      <Sidebar/>
      <div className='flex-1 min-w-0 ml-0 md:ml-[300px] p-6'>
        <Outlet/>
      </div>
    </div>
  )
}

export default Dashboard