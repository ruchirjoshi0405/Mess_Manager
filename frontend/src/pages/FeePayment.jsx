import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

function FeePayment() {
    const { user } = useSelector((store) => store.user)
    const token = localStorage.getItem('accessToken')

    const [loading, setLoading] = useState(false)
    const [fetchingLedger, setFetchingLedger] = useState(true)
    const [feeHistory, setFeeHistory] = useState([])
    const [feeDetails, setFeeDetails] = useState(null)

    // Fetch the logged-in student's personal fee status and transaction history
    const fetchFeeLedger = async () => {
        try {
            setFetchingLedger(true)
            const res = await axios.get(`${import.meta.env.VITE_URL}/api/v1/finance/fee/history`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                console.log('history res.data, ', res.data);
                // Mapping history directly to your state setup
                setFeeHistory(res.data.history || [])
                setFeeDetails(res.data.history[0] || null);
            }
        } catch (error) {
            console.error("Ledger fetch error:", error)
            toast.error("Failed to load fee account details.")
        } finally {
            setFetchingLedger(false)
        }
    }

    useEffect(() => {
        if (token) fetchFeeLedger()
    }, [token])

    // Initialize the checkout pipeline using the Razorpay script window
    const handlePayment = async () => {
        if (feeDetails.status === 'Paid') {
            toast.success("Your mess balance is completely clear!")
            return
        }
        /* if (feeDetails.status === 'Pending') {
            toast.error("Please Wait for your previous payment to be verified!")
            return
        } */

        try {
            setLoading(true)

            // 1. Pass both amount AND the semester/month session tag to avoid the 400 error
            const orderRes = await axios.post(`${import.meta.env.VITE_URL}/api/v1/finance/fee/pay`, {
                amount: feeDetails.amount,
                month: feeDetails.month // e.g., "Semester-1 (July-Dec)"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!orderRes.data.success) {
                throw new Error(orderRes.data.message || "Order initialization failed.")
            }

            // 2. Destructure keys safely from unified root format response
            const { orderId, amount, currency, razorpayKey } = orderRes.data

            const options = {
                key: razorpayKey,
                amount: amount,
                currency: currency,
                name: "Campus Mess Portal",
                description: "Mess Fee Payment",
                order_id: orderId,

                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post(
                            `${import.meta.env.VITE_URL}/api/v1/finance/fee/verify`,
                            response,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );

                        if (verifyRes.data.success) {
                            toast.success("Payment verified! Account updated successfully.");
                            await fetchFeeLedger();
                        } else {
                            toast.error("Payment verification failed.");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Verification processing failed.");
                    }
                },

                modal: {
                    ondismiss: async function () {
                        try {
                            const res =await axios.post(
                                `${import.meta.env.VITE_URL}/api/v1/finance/fee/verify`,
                                {
                                    razorpay_order_id: orderId,
                                    paymentFailed: true
                                },
                                {
                                    headers: { Authorization: `Bearer ${token}` }
                                }
                            );

                            console.log('res, ', res);

                            toast.error("Payment cancelled.");
                            await fetchFeeLedger();
                        } catch (err) {
                            console.error(err);
                            toast.error("Failed to update payment status.");
                        }
                    }
                },

                prefill: {
                    name: `${user?.firstName || ""} ${user?.lastName || ""}`,
                    email: user?.email,
                    contact: user?.phoneNo || ""
                },

                theme: {
                    color: "#db2777"
                }
            };

            const razorpayWindow = new window.Razorpay(options);

            razorpayWindow.on("payment.failed", async function () {
                try {
                    const res = await axios.post(
                        `${import.meta.env.VITE_URL}/api/v1/finance/fee/verify`,
                        {
                            razorpay_order_id: orderId,
                            paymentFailed: true
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );

                    toast.error("Payment failed. Please try again.");
                    await fetchFeeLedger();
                } catch (err) {
                    console.error(err);
                }
            });

            razorpayWindow.open();

        } catch (error) {
            console.error("Payment pipeline error:", error)
            toast.error(error.response?.data?.message || "Could not spin up the transaction gate.")
        } finally {
            setLoading(false)
        }
    }

    if (fetchingLedger) {
        return (
            <div className="flex justify-center items-center py-40 min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    return (
        <div className="mt-25 pt-24 min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Due Invoice Summary Column */}
                <Card className="md:col-span-1 border border-gray-200 shadow-sm rounded-2xl bg-white flex flex-col justify-between">
                    <div>
                        <CardHeader className="pb-4">
                            <div className="p-2.5 bg-pink-50 rounded-xl w-fit text-pink-600 mb-2">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900">Current Fees</CardTitle>
                            <CardDescription>Your statement balance itemized for this calendar block.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Amount Outstanding</span>
                                {feeDetails?.status !== 'Paid' ?
                                    <span className="text-4xl font-black text-gray-900">₹{feeDetails?.amount.toLocaleString("en-IN")}</span> :
                                    <span className="text-4xl font-black text-gray-900">₹{0}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                {feeDetails?.status === 'Unpaid' || feeDetails?.status === 'Failed' ? (
                                    <span className="flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Unpaid
                                    </span>
                                ) : feeDetails?.status === 'Pending' ? (
                                    <span className="flex items-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Pending Clearance
                                    </span>
                                ) : (
                                    <span className="flex items-center text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Account Clear
                                    </span>
                                )
                                }
                            </div>
                        </CardContent>
                    </div>
                    <CardFooter className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                        <Button
                            onClick={handlePayment}
                            disabled={loading || feeDetails?.status === 'Paid'}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl cursor-pointer shadow-sm transition-colors py-5"
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Opening Gate...</> : `Pay Balance Now`}
                        </Button>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span>Encrypted 256-bit automated transaction shield</span>
                        </div>
                    </CardFooter>
                </Card>

                {/* Historical Ledger Audit Column */}
                <Card className="md:col-span-2 border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
                        <CardTitle className="text-lg font-bold text-gray-800">Payment Audit Logs</CardTitle>
                        <CardDescription>Historical review of finalized digital payment tokens processed online.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex p-0 max-h-[360px] overflow-y-auto">
                        {feeHistory.length === 0 ? (
                            <div className="teaqxt-center py-20 text-sm text-gray-400 italic">No past receipts found on record.</div>
                        ) : (
                            <div className="space-y-3 justify-between">
                                {feeHistory.map((receipt) => (
                                    <div
                                        key={receipt._id}
                                        className="flex items-center justify-between gap-6 rounded-xl border border-gray-200 bg-white px-6 py-5 hover:shadow-md transition"
                                    >
                                        {/* Month */}
                                        <div className="flex items-center gap-4 min-w-[250px]">
                                            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-pink-600" />
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {receipt.month}
                                                </h3>

                                                <p className="text-xs text-gray-500">
                                                    Order ID:{" "}
                                                    <span className="font-mono">
                                                        {receipt.razorpayOrderId || "BULK_INITIATED_BY_ADMIN"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-center min-w-[120px]">
                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                Amount
                                            </p>

                                            <p className="text-lg font-bold text-gray-900">
                                                ₹{receipt.amount.toLocaleString("en-IN")}
                                            </p>
                                        </div>

                                        {/* Payment ID */}
                                        <div className="flex-1 min-w-[220px]">
                                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                                                Payment ID
                                            </p>

                                            <p className="font-mono text-sm text-blue-700 truncate">
                                                {receipt.razorpayPaymentId || "Not Generated"}
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <div className="min-w-[110px] text-right">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold 
                                                    ${receipt.status === "Paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : receipt.status === "Pending"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : receipt.status === "Unpaid"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                ● {receipt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default FeePayment