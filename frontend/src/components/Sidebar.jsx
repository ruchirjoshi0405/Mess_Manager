import { LayoutDashboard, PlusCircle, UtensilsCrossed, Users, Receipt, CalendarDays } from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='hidden fixed md:block border-r bg-pink-50 border-pink-200 z-10 w-[300px] p-6 space-y-2 h-screen'>
      <div className='text-center pt-24 px-3 space-y-2'>
        {/* 1. Financial Analytics Section */}
        <NavLink
          to='/dashboard/financials'
          className={({ isActive }) => `text-base ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-transparent text-gray-700 hover:bg-pink-100/50"} flex items-center gap-3 font-bold cursor-pointer p-3.5 rounded-2xl w-full transition-all`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Financials</span>
        </NavLink>

        <NavLink
          to='/dashboard/view-menu'
          className={({ isActive }) => `text-base ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-transparent text-gray-700 hover:bg-pink-100/50"} flex items-center gap-3 font-bold cursor-pointer p-3.5 rounded-2xl w-full transition-all`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span>Weekly Menu</span>
        </NavLink>

        <NavLink
          to='/dashboard/add-expense'
          className={({ isActive }) => `text-base ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-transparent text-gray-700 hover:bg-pink-100/50"} flex items-center gap-3 font-bold cursor-pointer p-3.5 rounded-2xl w-full transition-all`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add Expense</span>
        </NavLink>

        {/* 4. Real-time Kitchen Headcounts Analytics Summary */}
        <NavLink
          to='/dashboard/headcounts'
          className={({ isActive }) => `text-base ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-transparent text-gray-700 hover:bg-pink-100/50"} flex items-center gap-3 font-bold cursor-pointer p-3.5 rounded-2xl w-full transition-all`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>Portion Headcounts</span>
        </NavLink>

        {/* 5. Registered Student Profiles Master Roster Grid */}
        <NavLink
          to='/dashboard/students'
          className={({ isActive }) => `text-base ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-transparent text-gray-700 hover:bg-pink-100/50"} flex items-center gap-3 font-bold cursor-pointer p-3.5 rounded-2xl w-full transition-all`}
        >
          <Users className="w-5 h-5" />
          <span>Student Roster</span>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar