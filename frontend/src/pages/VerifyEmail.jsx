import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constants';

function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState("Verifying...");
    const navigate = useNavigate();

    const verifyEmail = async () => {
        console.log(token);
        try {
            const res = await axios.post(`${USER_API_END_POINT}/verify`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.success) {
                setStatus("✔ Email Verified Successfuly");
                setTimeout(() => {
                    navigate('/login')
                }, 2000);
            } else {
                setStatus("✘ Verification failed. Please try again. " + res.data.message);
            }
        } catch (error) {
            console.error(error);
            setStatus("✘ Verification failed. Please try again.");
        }
    };
    useEffect(() => {
        verifyEmail();
    }, [token]);
    return (
        <div className='relative w-full overflow-hidden'>
            <div className="min-h-screen flex items-center justify-center bg-pink-100 px-4">
                <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center'>
                    <h2 className='text-2xl font-semibold text-green-500 mb-4'>{status}</h2>
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail