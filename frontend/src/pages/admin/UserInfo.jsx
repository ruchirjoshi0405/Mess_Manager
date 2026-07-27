import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import userLogo from '../../assets/User.png'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import axios from 'axios'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { setUser } from '@/redux/userSlice'

function UserInfo() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [updatedUser, setUpdatedUser] = useState(null)
  const [file, setFile] = useState(null);
  const { user } = useSelector(store => store.user)
  const params = useParams()
  const userId = params.id;
  const [loading, setLoading] = useState(false)

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
          "Content-Type": "multipart/form-data"
        },
      }
      );

      if (res.data.success) {
        toast.success(res.data.message || 'Profile updated successfully!');
        if (user && user._id === userId) {
          dispatch(setUser(res.data.user));
        }
        setUpdatedUser(res.data.user);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    } finally {
      setLoading(false)
    }
  }

  const getUserDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/user/getUser/${userId}`);
      if (res.data.success) {
        setUpdatedUser(res.data.user)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message)
    }
  }
  useEffect(() => {
    getUserDetails()
    console.log("dfghjkj")
  }, [])

  return (
    <div className='pt-5 min-h-screen bg-gray-100'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col justify-center items-center min-h-screen bg-gray-100'>
          <div className='flex justify-between gap-10'>
            <Button onClick={() => navigate(-1)}><ArrowLeft /></Button>
            <h1 className='font-bold mb-7 text-2xl text-gray-800'>Update Profile</h1>
          </div>
          <div className='w-full flex flex-col md:flex-row gap-10 justify-between items-start max-w-4xl px-2'>

            {/* Left Profile Picture Block */}
            <div className='flex flex-col items-center mx-auto md:mx-0 flex-shrink-0 w-32'>
              {/* Fixed placeholder container */}
              <div className='w-32 h-32 rounded-full border-4 border-pink-600 shadow-md overflow-hidden flex items-center justify-center bg-gray-200 relative'>
                <img
                  src={updatedUser?.profilePic || userLogo}
                  alt=""
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
                    value={updatedUser?.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className='block text-sm font-medium text-gray-700'>Last Name</Label>
                  <Input
                    type='text'
                    name='lastName'
                    className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                    value={updatedUser?.lastName}
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
                  defaultValue={updatedUser?.email}
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
                  value={updatedUser?.phoneNo}
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
                  value={updatedUser?.address}
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
                    value={updatedUser?.city}
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
                    value={updatedUser?.zipcode}
                    onChange={handleChange}
                    className='w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-pink-500'
                  />
                </div>
              </div>

              <div className='flex gap-3 items-center'>
                <Label className='block text-sm font-medium text-gray-700'>Role: </Label>
                <RadioGroup
                  value={updatedUser?.role}
                  onValueChange={(value) => setUpdatedUser({ ...updatedUser, role: value })}
                  className='flex items-center'
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user">User</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin">Admin</Label>
                  </div>
                </RadioGroup>
              </div>
              {/* Submit Trigger Execution */}
              <Button type='submit' className='w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-colors'>
                {loading ? <><Loader2 className='h-4 animate-spin mr-2' />Please Wait</> : 'Update Profile'}
              </Button>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserInfo