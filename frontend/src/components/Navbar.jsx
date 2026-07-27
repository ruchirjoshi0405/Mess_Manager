import { CalendarDays, UtensilsCrossed, Wallet } from 'lucide-react' // Swapped ShoppingCart for Mess-relevant icons
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '@/redux/userSlice'
import { clearMenuState } from '@/redux/menuSlice' // Updated import to clear our new slice
import axios from 'axios'
import { toast } from 'sonner'
import logo from '../assets/MNNIT_logo.png'

function Navbar() {
  const { user } = useSelector(store => store.user);
  const accessToken = localStorage.getItem('accessToken');

  // Cleanly identify user permission levels
  const isManager = user?.role === 'admin' || user?.role === 'mess_manager';
  const isStudent = user?.role === 'student';

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const logoutHandler = async () => {
    try {
      // Dynamic VITE_URL mapping (matches your login setup)
      const res = await axios.post(
        `${import.meta.env.VITE_URL || 'http://localhost:8000'}/api/v1/user/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.data.success) {
        localStorage.removeItem('accessToken');
        dispatch(clearMenuState()); // Wipes the daily calendar/attendance data safely
        dispatch(setUser(null));
        toast.success(res.data.message || 'Logged out successfully!');
        navigate('/'); // Redirect to home so protected routes don't crash
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <header className='bg-pink-50 fixed top-0 left-0 w-full z-50 border-b border-pink-200'>
      <div className='max-w-7xl mx-auto flex justify-between items-center py-2 px-4'>

        {/* Logo Section */}
        <Link to={`/`}>
          <img src={logo} alt="Logo" className='w-[70px] h-[70px] object-contain' />
        </Link>

        {/* Nav section */}
        <nav className='flex items-center gap-8 justify-between'>
          <ul className='flex gap-7 items-center text-lg font-semibold text-gray-700'>
            <li>
              <Link to='/' className='hover:text-pink-600 transition-colors'>Home</Link>
            </li>

            {user && (
              <li>
                <Link to={`/profile/${user._id}`} className='hover:text-pink-600 transition-colors'>
                  Hello, {user.firstName}
                </Link>
              </li>
            )}

            {/* Dashboard Link for Management Staff */}
            {isManager && (
              <li>
                <Link to={`/dashboard/financials`} className='hover:text-pink-600 transition-colors'>
                  Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* Icon Shortcuts for Logged-In Students */}
          {isStudent && (
            <div className='flex gap-6 mr-4'>
              <Link to='/attendance' className='text-gray-700 hover:text-pink-600 transition-colors flex items-center gap-1' title="Daily Attendance">
                <CalendarDays className='w-6 h-6' />
              </Link>
              <Link to='/fees' className='text-gray-700 hover:text-pink-600 transition-colors flex items-center gap-1' title="Pay Mess Fees">
                <Wallet className='w-6 h-6' />
              </Link>
            </div>
          )}

          {/* Dynamic Auth Button */}
          {user ? (
            <Button onClick={logoutHandler} className='bg-pink-500 hover:bg-pink-600 text-white cursor-pointer transition-colors'>
              Logout
            </Button>
          ) : (
            <Button onClick={() => navigate('/login')} className='bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white cursor-pointer transition-all shadow-md'>
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar