import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, GraduationCap, CalendarRange, Landmark, Coins, CheckCircle2, XCircle, AlertCircle, RefreshCw, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { FINANCE_API_END_POINT, USER_API_END_POINT } from '@/utils/constants'

function StudentRoster() {
    const accessToken = localStorage.getItem('accessToken')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingUserId, setUpdatingUserId] = useState(null)

    // UI control state parameters for bulk initialization popups
    const [isBulkFormOpen, setIsBulkFormOpen] = useState(false)
    const [bulkAmount, setBulkAmount] = useState("25000")
    const [bulkSession, setBulkSession] = useState("Semester-1 (July-Dec)")
    const [actionLoading, setActionLoading] = useState(false)

    // State tracking payment documents mapped by student userId keys
    const [paymentStatuses, setPaymentStatuses] = useState({})

    // Fetch payment ledger records for the specified window session period
    const fetchPaymentLedgerState = async (sessionTag) => {
        try {
            const res = await axios.get(`${FINANCE_API_END_POINT}/fee/allStatuses?sessionOrMonth=${sessionTag}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            if (res.data.success) {
                const statusMap = {}
                res.data.payments.forEach(payment => {
                    statusMap[payment.userId] = payment
                })
                setPaymentStatuses(statusMap)
            }
        } catch (error) {
            console.error("Ledger database parsing failure:", error)
        }
    }

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${USER_API_END_POINT}/allUsers`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            if (res.data.success) {
                setStudents(res.data.users)
                await fetchPaymentLedgerState(bulkSession)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to compile active campus accounts ledger.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (accessToken) fetchStudents()
    }, [accessToken])

    const handleRoleChange = async (userId, targetRole) => {
        try {
            setUpdatingUserId(userId)
            const res = await axios.put(`${USER_API_END_POINT}/update-role`, {
                userId,
                role: targetRole
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            if (res.data.success) {
                toast.success("User permission parameters adjusted successfully!")
                setStudents(prev => prev.map(s => s._id === userId ? { ...s, role: targetRole } : s))
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to alter account clearance credentials.")
        } finally {
            setUpdatingUserId(null)
        }
    }

    const handleIndividualFeeChange = async (userId, targetStatus) => {
        try {
            setUpdatingUserId(userId)
            const res = await axios.post(`${FINANCE_API_END_POINT}/fee/individualAllocate`, {
                userId,
                amount: bulkAmount,
                sessionOrMonth: bulkSession,
                status: targetStatus
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            if (res.data.success) {
                toast.success("Student payment record amended independently!")
                setPaymentStatuses(prev => ({
                    ...prev,
                    [userId]: res.data.payment
                }))
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to update individual student balance demand.")
        } finally {
            setUpdatingUserId(null)
        }
    }

    const handleTriggerBulkFeeAllocation = async (e) => {
        e.preventDefault()
        if (!bulkAmount || !bulkSession) {
            toast.error("Please supply valid amount and description parameters.")
            return
        }

        try {
            setActionLoading(true)
            const res = await axios.post(`${FINANCE_API_END_POINT}/fee/bulkFee`, {
                amount: bulkAmount,
                sessionOrMonth: bulkSession
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            if (res.data.success) {
                toast.success(res.data.message || "Bulk ledger update succeeded!")
                setIsBulkFormOpen(false)
                await fetchPaymentLedgerState(bulkSession)
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to update bulk ledger collections.")
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40 min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    return (
        <div className="w-full max-w-7xl py-24 mx-auto p-4 flex flex-col gap-6 min-h-screen">

            {/* Header Area with Control Modifiers */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hosteller Master Roster</h1>
                    <p className="text-gray-500 text-sm mt-1">Audit profile configurations, hostel room allotments, and active billing cycles.</p>
                </div>

                <button
                    onClick={() => setIsBulkFormOpen(!isBulkFormOpen)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
                >
                    <Coins className="w-4 h-4" /> Initialize Group Fee
                </button>
            </div>

            {/* EXPANDABLE INLINE BILLING COMPONENT BLOCK */}
            {isBulkFormOpen && (
                <div className="w-full p-6 bg-pink-50/40 border border-pink-100 rounded-2xl shadow-inner transition-all flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                        <h3 className="text-sm font-black text-pink-900 uppercase tracking-wider flex items-center gap-1">
                            <Landmark className="w-4 h-4" /> Mass Session Fee Allocation Panel
                        </h3>
                        <p className="text-xs text-pink-700 mt-0.5">
                            This batch execution provisions a fixed starting balance request to every student currently displayed on the master ledger below.
                        </p>
                    </div>

                    <form onSubmit={handleTriggerBulkFeeAllocation} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Allocation Amount (₹):</label>
                            <input
                                type="number"
                                value={bulkAmount}
                                onChange={(e) => setBulkAmount(e.target.value)}
                                className="bg-white border border-gray-200 px-3 py-2 text-sm rounded-xl outline-none focus:border-pink-500 font-semibold"
                                placeholder="e.g. 25000"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Window Tag / Period:</label>
                            <input
                                type="text"
                                value={bulkSession}
                                onChange={(e) => {
                                    setBulkSession(e.target.value)
                                    fetchPaymentLedgerState(e.target.value)
                                }}
                                className="bg-white border border-gray-200 px-3 py-2 text-sm rounded-xl outline-none focus:border-pink-500 font-semibold"
                                placeholder="e.g. 2026 Jun-Dec"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl shadow h-[38px] transition-all cursor-pointer flex justify-center items-center"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Batch Ledger"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsBulkFormOpen(false)}
                                className="px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs rounded-xl h-[38px] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {(!students || students.length === 0) ? (
                <p className="text-center text-sm text-gray-400 italic py-20 bg-white rounded-2xl border border-gray-100">No registered profiles found.</p>
            ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-bold">Student Name</th>
                                <th className="px-6 py-4 font-bold flex items-center gap-1"><GraduationCap className="w-4 h-4 text-gray-400" /> Roll Details</th>
                                <th className="px-6 py-4 font-bold"><Building2 className="w-4 h-4 text-gray-400 inline mr-1" /> Hostel Details</th>
                                <th className="px-6 py-4 font-bold"><CalendarRange className="w-4 h-4 text-gray-400 inline mr-1" /> Fee Cycle</th>
                                <th className="px-6 py-4 font-bold">Fee Tracking State / Override</th>
                                <th className="px-6 py-4 font-bold">System Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-600 bg-white">
                            {students?.map((student) => {
                                const paymentRecord = paymentStatuses[student._id]

                                return (
                                    <tr key={student._id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{`${student.firstName || ''} ${student.lastName || ''}`}</p>
                                                <span className="text-xs text-gray-400 block mt-0.5">{student.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                                            {student.rollNumber || "N/A"}
                                        </td>
                                        
                                        {/* Hostel Column */}
                                        <td className="px-6 py-4">
                                            {student.hostelName ? (
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-xs">{student.hostelName}</p>
                                                    <span className="text-[11px] text-gray-400 block">Room: {student.roomNumber || "Unassigned"}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>

                                        {/* Fee Cycle Column */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                                {paymentRecord?.sessionOrMonth || bulkSession}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {!paymentRecord || paymentRecord.status === "Unpaid" ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-400 border border-blue-200">
                                                        <AlertCircle className="w-3 h-3" /> Unpaid
                                                    </span>
                                                ) : paymentRecord.status === "Paid" ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        <CheckCircle2 className="w-3 h-3" /> Paid (₹{paymentRecord.amount})
                                                    </span>
                                                ) : paymentRecord.status === "Failed" ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
                                                        <XCircle className="w-3 h-3" /> Failed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                                        <RefreshCw className="w-3 h-3" /> Pending (₹{paymentRecord.amount})
                                                    </span>
                                                )}

                                                {!paymentRecord?.razorpayPaymentId && (
                                                    <select
                                                        value={paymentRecord ? paymentRecord.status : "None"}
                                                        disabled={updatingUserId === student._id}
                                                        onChange={(e) => {
                                                            if (e.target.value === "None") return
                                                            handleIndividualFeeChange(student._id, e.target.value)
                                                        }}
                                                        className="bg-white border border-gray-200 text-[10px] font-bold text-gray-500 rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="None" disabled>Action Override</option>
                                                        <option value="Unpaid">Set Demand Unpaid</option>
                                                        <option value="Paid">Mark Settled (Offline/Cash)</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>

                                        {/* Combined System Role & Change Selector Column */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold 
                                                    ${student.role === 'admin'
                                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                                        : student.role === 'mess_manager'
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    }`}>
                                                    {student.role === 'mess_manager' ? 'Mess Manager' : student.role}
                                                </span>
                                                <select
                                                    value={student.role}
                                                    disabled={updatingUserId === student._id}
                                                    onChange={(e) => handleRoleChange(student._id, e.target.value)}
                                                    className="bg-white border border-gray-200 text-[11px] font-semibold text-gray-600 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="mess_manager">Mess Manager</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default StudentRoster