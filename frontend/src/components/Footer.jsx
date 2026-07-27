import React from 'react'
import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaPinterest, FaTwitterSquare } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  return (
    <footer className='bg-gray-900 text-gray-200 py-10'>
      {/* Top Layout Grid Container */}
      <div className='max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 md:justify-between'>
        
        {/* Info Column */}
        <div className='mb-6 md:mb-0'>
          <Link to='/'>
            <img src="/Logo.png" alt="EKart Logo" className='w-32 object-contain' />
          </Link>
          <p className='mt-2 text-sm text-gray-400'>Powering Your World with the Best in Electronics.</p>
          <p className='mt-2 text-sm text-gray-400'>123 Electronics St, Style City, NY 10001</p>
          <p className='text-sm text-gray-400'><span className='font-medium text-gray-300'>Email:</span> support@Zaptro.com</p>
          <p className='text-sm text-gray-400'><span className='font-medium text-gray-300'>Phone:</span> (123) 456-7890</p>
        </div>

        {/* Customer Service Link Column */}
        <div className='mb-6 md:mb-0'>
          <h3 className='text-xl font-semibold text-white'>Customer Service</h3>
          <ul className='mt-2 text-sm space-y-2 text-gray-400'>
            <li className='hover:text-pink-500 transition-colors cursor-pointer'>Contact Us</li>
            <li className='hover:text-pink-500 transition-colors cursor-pointer'>Shipping & Returns</li>
            <li className='hover:text-pink-500 transition-colors cursor-pointer'>FAQs</li>
            <li className='hover:text-pink-500 transition-colors cursor-pointer'>Order Tracking</li>
            <li className='hover:text-pink-500 transition-colors cursor-pointer'>Size Guide</li>
          </ul>
        </div>

        {/* Social Media Links Column */}
        <div className='mb-6 md:mb-0'>
          <h3 className='text-xl font-semibold text-white'>Follow Us</h3>
          <div className='flex space-x-4 mt-2 text-2xl text-gray-400'>
            <FaFacebook className='hover:text-blue-500 transition-colors cursor-pointer' />
            <FaInstagram 
            onClick={() => window.open("https://www.instagram.com/accounts/onetap/", '_blank', 'noopener,noreferrer')}
            className='hover:text-pink-500 transition-colors cursor-pointer' />
            <FaTwitterSquare className='hover:text-sky-400 transition-colors cursor-pointer' />
            <FaPinterest className='hover:text-red-600 transition-colors cursor-pointer' />
          </div>
        </div>

        {/* Newsletter Subscription Column */}
        <div>
          <h3 className='text-xl font-semibold text-white'>Stay in the Loop</h3>
          <p className='mt-2 text-sm text-gray-400'>Subscribe to get special offers, free giveaways, and more.</p>
          <form action="" onSubmit={() => navigate('/subscribe')} className='mt-4 flex'>
            <input 
              type="email" 
              placeholder='Your email address' 
              className='w-full p-2 rounded-l-md bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-500 text-sm'
            />
            <button
              type='submit' 
              className='bg-pink-600 text-white px-4 rounded-r-md hover:bg-pink-700 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap'
            >
              Subscribe
            </button>
          </form>
        </div>

      </div>

      {/* Bottom Copyright Section */}
      <div className='max-w-7xl mx-auto px-4 mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-500'>
        <p>&copy; {new Date().getFullYear()} <span className='text-pink-600 font-medium'>EKart</span>. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer