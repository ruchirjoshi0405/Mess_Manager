import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import userLogo from '@/assets/User.png'
import { toast } from 'sonner'
import { setUser } from '@/redux/userSlice'
import axios from 'axios'

const Profile = () => {
    const [loading, setLoading] = useState(false)
    const { user } = useSelector(store => store.user)
    const params = useParams()
    const userId = params.userId;
    const [updatedUser, setUpdatedUser] = useState({
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phoneNo: user?.phoneNo,
        address: user?.address,
        city: user?.city,
        zipcode: user?.zipcode,
        profilePic: user?.profilePic,
        role: user?.role
    })
    const dispatch = useDispatch()
    const [file, setFile] = useState(null);

    const handleChange = (e) => {
        setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value })
    }
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return; // Guard clause in case they cancel the file picker

        
        setFile(selectedFile);
        
        const previewUrl = URL.createObjectURL(selectedFile);

        setUpdatedUser({
            ...updatedUser,
            profilePic: previewUrl // Assign the string URL directly
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const accessToken = localStorage.getItem('accessToken');
        try {
            setLoading(true)
            //use FormData for text + file
            const formData = new FormData();
            formData.append('firstName', updatedUser.firstName);
            formData.append('lastName', updatedUser.lastName);
            formData.append('email', updatedUser.email);
            formData.append('phoneNo', updatedUser.phoneNo);
            formData.append('address', updatedUser.address);
            formData.append('city', updatedUser.city);
            formData.append('zipcode', updatedUser.zipcode);
            formData.append('profilePic', updatedUser.profilePic);
            formData.append('role', updatedUser.role);

            if (file) {
                formData.append("file", file); // image file for backend multer
            }
            const res = await axios.put(
                `http://localhost:8000/api/v1/user/update/${userId}`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
            );

            if (res.data.success) {
                toast.success(res.data.message || 'Profile updated successfully!');
                dispatch(setUser(res.data.user));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message);
        } finally{
            setLoading(false)
        }
    }

    return (
        <div className='pt-20 min-h-screen bg-gray-100 px-4 py-8'>
            <Tabs defaultValue="profile" className="max-w-7xl mx-auto flex flex-col items-center">


                {/* Tab 1: Profile Customization & Details */}
                <TabsContent value="profile" className="w-full flex justify-center">
                    <div className="w-full max-w-4xl bg-gray-100 p-6 rounded-2xl flex flex-col items-center">
                        <h1 className='font-bold mb-7 text-2xl text-gray-800'>Update Profile</h1>

                        <div className='w-full flex flex-col md:flex-row gap-10 justify-between items-start max-w-4xl px-2'>

                            {/* Left Profile Picture Block */}
                            <div className='flex flex-col items-center mx-auto md:mx-0 flex-shrink-0 w-32'>
                                {/* Fixed placeholder container */}
                                <div className='w-32 h-32 rounded-full border-4 border-pink-600 shadow-md overflow-hidden flex items-center justify-center bg-gray-200 relative'>
                                    <img
                                        src={updatedUser?.profilePic || userLogo}
                                        alt=""
                                        onError={() => setImageError(true)}
                                        className='w-full h-full object-cover'
                                    />
                                </div>

                                <Label className='w-full mt-4 cursor-pointer bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm text-center shadow-sm whitespace-nowrap'>
                                    Change Picture
                                    <input
                                        type="file"
                                        accept='image/*'
                                        className='hidden'
                                        onChange={handleFileChange}
                                    />
                                </Label>
                            </div>

                            {/* Right Profile Form Wrapper */}
                            <form onSubmit={handleSubmit} className='flex-1 w-full space-y-4 shadow-lg p-6 rounded-xl bg-white'>

                                {/* Responsive Name Rows */}
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div>
                                        <Label className='block text-sm font-medium text-gray-700'>First Name</Label>
                                        <Input
                                            type='text'
                                            name='firstName'
                                            className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                                            value={updatedUser.firstName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <Label className='block text-sm font-medium text-gray-700'>Last Name</Label>
                                        <Input
                                            type='text'
                                            name='lastName'
                                            className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                                            value={updatedUser.lastName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Email (Read Only Field) */}
                                <div>
                                    <Label className='block text-sm font-medium text-gray-700'>Email</Label>
                                    <Input
                                        type='email'
                                        name='email'
                                        defaultValue={updatedUser.email}
                                        disabled
                                        onChange={handleChange}
                                        className='w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 text-gray-500 cursor-not-allowed'
                                    />
                                </div>

                                {/* Contact Data Field */}
                                <div>
                                    <Label className='block text-sm font-medium text-gray-700'>Phone Number</Label>
                                    <Input
                                        type='text'
                                        name='phoneNo'
                                        value={updatedUser.phoneNo}
                                        onChange={handleChange}
                                        placeholder='Enter your Contact No'
                                        className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                                    />
                                </div>

                                {/* Address Field */}
                                <div>
                                    <Label className='block text-sm font-medium text-gray-700'>Address</Label>
                                    <Input
                                        type='text'
                                        name='address'
                                        placeholder='Enter your Address'
                                        value={updatedUser.address}
                                        onChange={handleChange}
                                        className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                                    />
                                </div>

                                {/* Location Specific Input Elements */}
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div>
                                        <Label className='block text-sm font-medium text-gray-700'>City</Label>
                                        <Input
                                            type='text'
                                            name='city'
                                            placeholder='Enter your City'
                                            value={updatedUser.city}
                                            onChange={handleChange}
                                            className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                                        />
                                    </div>
                                    <div>
                                        <Label className='block text-sm font-medium text-gray-700'>Zip Code</Label>
                                        <Input
                                            type='text'
                                            name='zipcode'
                                            placeholder='Enter your ZipCode'
                                            value={updatedUser.zipcode}
                                            onChange={handleChange}
                                            className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                                        />
                                    </div>
                                </div>

                                {/* Submit Trigger Execution */}
                                <Button type='submit' className='w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-colors'>
                                    {loading ? <><Loader2 className='h-4 animate-spin mr-2'/>Please Wait</> : 'Update Profile'}
                                </Button>

                            </form>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Profile