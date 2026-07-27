import React from 'react'
import { Button } from './components/ui/button'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Verify from './pages/Verify'
import VerifyEmail from './pages/VerifyEmail'
import Footer from './components/Footer'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'

// Student Component View Mapping (Replaces retail store pages)
import StudentAttendance from './pages/StudentAttendance' // Replaces Cart.jsx / Products.jsx
import FeePayment from './pages/FeePayment'            // Replaces AddressForm.jsx

// Management Component View Mapping (Replaces e-commerce admin panels)
import Financials from './pages/admin/Financials'         // Transformed to financial analytics
import AddExpense from './pages/admin/AddExpense'         // Transformed to Add/Edit Menu item
import MenuSchedule from './pages/admin/MenuSchedule'     // Transformed to Weekly Menu Overview
import StudentRoster from './pages/admin/StudentRoster'         // View/Manage hostellers
import UserInfo from './pages/admin/UserInfo'             // Specific hosteller profile
import ProtectedRoute from './components/ProtectedRoute'
import Headcounts from './pages/admin/HeadCounts'

const router = createBrowserRouter([
  {
    path: '/',
    element:
      <>
        <Navbar />
        <Home />
      </>
  },
  {
    path: '/signup',
    element: <><Signup /></>
  },
  {
    path: '/login',
    element: <><Login /></>
  },
  {
    path: '/verify',
    element: <><Verify /></>
  },
  {
    path: '/verify/:token',
    element: <><VerifyEmail /></>
  },
  {
    path: '/profile/:userId',
    element:
      <ProtectedRoute>
        <Navbar />
        <Profile />
      </ProtectedRoute>
  },
  // 1. Core Student Hub: Attendance Tracker (Eating / Skipping toggles per date)
  {
    path: '/attendance',
    element:
      <ProtectedRoute>
        <Navbar />
        <StudentAttendance />
      </ProtectedRoute>
  },

  // 2. Core Student Hub: Month-wise Fees Ledger Portal (Razorpay)
  {
    path: '/fees',
    element:
      <ProtectedRoute>
        <Navbar />
        <FeePayment />
      </ProtectedRoute>
  },
  // 3. Centralized Management Panel Layout (Restricted to Admins & Mess Managers)
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['admin', 'mess_manager']}><Navbar /><Dashboard /></ProtectedRoute>,
    children: [
      {
        path: 'financials', // Replaces sales
        element: <Financials />
      },
      {
        path: 'add-expense',   // Replaces add-product
        element: <AddExpense />
      },
      {
        path: 'headcounts',  // Replaces orders
        element: <Headcounts />
      },
      {
        path: 'view-menu',
        element:
          <MenuSchedule />
      },
      {
        path: 'students',   // Replaces users
        element: <StudentRoster />
      },
      {
        path: 'students/:id', // Replaces users/:id
        element: <UserInfo />
      },
    ]
  },
])

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
