import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useSelector(store => store.user)

    if (!user) return <Navigate to='/login' />

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to='/' />
    }

    return children
}

export default ProtectedRoute