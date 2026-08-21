export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const USER_API_END_POINT = `${BASE_URL}/user`;
export const MESS_API_END_POINT = `${BASE_URL}/menu`;
export const ATTENDANCE_API_END_POINT = `${BASE_URL}/attendance`;
export const FINANCE_API_END_POINT = `${BASE_URL}/finance`;
export const COMMUNITY_API_END_POINT = `${BASE_URL}/community`;