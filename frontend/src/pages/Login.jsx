import React from 'react'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeOff, Eye, Loader2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setUser } from '@/redux/userSlice'

function Login() {
    const [showPassword, setShowPassword] = React.useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const submitHandler = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            // FIXED: Using dynamic environment URL configuration
            const res = await axios.post(`${import.meta.env.VITE_URL}/api/v1/user/login`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            if(res.data.success) {
                navigate('/')
                dispatch(setUser(res.data.user))
                localStorage.setItem('accessToken', res.data.accessToken)
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        // IMPROVEMENT: Updated to a soft modern background color profile for a premium aesthetic 
        <div className='flex justify-center items-center min-h-screen bg-gray-50/60 p-4'>
            <Card className="w-full max-w-sm shadow-md bg-white border border-gray-100 rounded-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Log into your account</CardTitle>
                    <CardDescription>
                        Enter your details below to Login.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submitHandler} className="flex flex-col gap-4">
                        <div className='grid gap-1.5'>
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="bg-white"
                            />
                        </div>
                        {/* FIXED: Removed the empty unneeded div layer that threw off coordinate mappings */}
                        <div className="grid gap-1.5 relative">
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <div className="relative flex items-center">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required 
                                    className="pr-10 bg-white w-full"
                                />
                                {/* FIXED: Re-positioned the eye click button securely inside the frame layout */}
                                <div className="absolute right-3 cursor-pointer text-gray-500 hover:text-gray-700 select-none">
                                    {showPassword ? (
                                        <EyeOff onClick={() => setShowPassword(false)} className='w-5 h-5' />
                                    ) : (
                                        <Eye onClick={() => setShowPassword(true)} className='w-5 h-5' />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            className="w-full bg-pink-600 text-white hover:bg-pink-700 transition-colors mt-2"
                            disabled={loading}
                        >
                            {loading ? <><Loader2 className='h-4 w-4 animate-spin mr-2'/>Please Wait</> : 'Login'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pt-0 pb-6">
                    <p className="text-gray-500 text-sm">
                        Don't have an account?{" "}
                        <Link to='/signup' className="hover:underline font-medium text-pink-600">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default Login;