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


function Signup() {
    const [showPassword, setShowPassword] = React.useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        rollNumber: '',  // New field
        hostelName: '',  // New field
        roomNumber: '',  // New field
        phoneNo: '',     // New field
    })

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
            // Points cleanly to your modular port v1 user path
            const res = await axios.post(`http://localhost:8000/api/v1/user/register`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            if(res.data.success) {
                navigate('/verify')
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='flex justify-center items-center min-h-screen bg-pink-100 p-4'>
            <Card className="w-full max-w-md"> {/* Adjusted max-w to handle additional fields cleanly */}
                <CardHeader>
                    <CardTitle>Create your account</CardTitle>
                    <CardDescription>
                        Enter your hostel and academic details below to join the mess portal.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submitHandler} className="flex flex-col gap-3">
                        {/* Row 1: Names */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className='grid gap-2'>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="John"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Row 2: Email & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className='grid gap-2'>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor="phoneNo">Phone Number</Label>
                                <Input
                                    id="phoneNo"
                                    name="phoneNo"
                                    type="text"
                                    placeholder="9876543210"
                                    required
                                    value={formData.phoneNo}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Row 3: Roll Number & Hostel Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className='grid gap-2'>
                                <Label htmlFor="rollNumber">Roll Number</Label>
                                <Input
                                    id="rollNumber"
                                    name="rollNumber"
                                    type="text"
                                    placeholder="CS-C-45"
                                    required
                                    value={formData.rollNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor="hostelName">Hostel Name</Label>
                                <Input
                                    id="hostelName"
                                    name="hostelName"
                                    type="text"
                                    placeholder="Hostel 1"
                                    required
                                    value={formData.hostelName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Row 4: Room Number & Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className='grid gap-2'>
                                <Label htmlFor="roomNumber">Room Number</Label>
                                <Input
                                    id="roomNumber"
                                    name="roomNumber"
                                    type="text"
                                    placeholder="302"
                                    required
                                    value={formData.roomNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2 relative">
                                <Label htmlFor="password">Password</Label>
                                <div className='relative flex items-center'>
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pr-10"
                                        required 
                                    />
                                    {showPassword ? (
                                        <EyeOff onClick={() => setShowPassword(false)} className='w-5 h-5 text-gray-500 absolute right-3 cursor-pointer select-none' />
                                    ) : (
                                        <Eye onClick={() => setShowPassword(true)} className='w-5 h-5 text-gray-500 absolute right-3 cursor-pointer select-none' />
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button 
                        onClick={submitHandler} 
                        type="submit" 
                        className="w-full cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? <><Loader2 className='h-4 animate-spin mr-2'/>Please Wait</> : 'Signup'}
                    </Button>
                    <p className="text-gray-700 text-sm"> 
                        Already have an account? <Link to={'/login'} className="hover:underline cursor-pointer text-pink-800 font-medium">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default Signup