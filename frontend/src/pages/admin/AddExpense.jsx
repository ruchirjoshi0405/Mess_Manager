import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, Receipt, Plus, X, Calendar, Wallet, ShoppingBag, Landmark, History, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { FINANCE_API_END_POINT } from '@/utils/constants'

const EXPENSE_CATEGORIES = ["Groceries", "Salaries", "Utilities", "Gas", "Maintenance", "Other"]
const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque"]
const INVENTORY_UNITS = ["kg", "Liters", "Packets", "Units", "Bags"]

function AddExpense() {
    const accessToken = localStorage.getItem('accessToken')
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [expenseHistory, setExpenseHistory] = useState([])

    // Form inputs
    const [supplierName, setSupplierName] = useState("")
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
    const [totalCost, setTotalCost] = useState("")
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])

    // Line items inventory inputs
    const [itemName, setItemName] = useState("")
    const [quantity, setQuantity] = useState("")
    const [unit, setUnit] = useState(INVENTORY_UNITS[0])
    const [itemsList, setItemsList] = useState([])

    // Fetch full history logs from database
    const fetchExpenseHistory = async () => {
        try {
            setHistoryLoading(true)
            const res = await axios.get(`${FINANCE_API_END_POINT}/expense/all`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            if (res.data.success) {
                setExpenseHistory(res.data.expenses)
            }
        } catch (error) {
            console.error("Failed to load historical statements:", error)
        } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        if (accessToken) fetchExpenseHistory()
    }, [accessToken])

    const handleAddItem = (e) => {
        e.preventDefault()
        if (!itemName.trim() || !quantity || Number(quantity) <= 0) {
            toast.error("Please supply a valid item name and numeric count.")
            return
        }
        setItemsList(prev => [...prev, {
            itemName: itemName.trim(),
            quantity: Number(quantity),
            unit: unit
        }])
        setItemName("")
        setQuantity("")
    }

    const handleRemoveItem = (idxToRemove) => {
        setItemsList(prev => prev.filter((_, idx) => idx !== idxToRemove))
    }

    const handleSubmitExpense = async (e) => {
        e.preventDefault()
        if (!supplierName.trim() || !totalCost || Number(totalCost) <= 0) {
            toast.error("Please fill in all core voucher parameters correctly.")
            return
        }
        console.log("items: ", itemsList);
        try {
            setLoading(true)
            console.log("items:as ", itemsList);
            console.log(`${FINANCE_API_END_POINT}/expense/log`);
            const res = await axios.post(`${FINANCE_API_END_POINT}/expense/log`, {
                supplierName: supplierName.trim(),
                category,
                items: itemsList,
                totalCost: Number(totalCost),
                paymentMethod,
                expenseDate
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            if (res.data.success) {
                toast.success("Expense voucher committed successfully!")
                setSupplierName("")
                setTotalCost("")
                setItemsList([])
                setItemName("")
                setQuantity("")
                setExpenseDate(new Date().toISOString().split('T')[0])
                // Pull down history log updates dynamically without full reload
                fetchExpenseHistory()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to commit expense voucher.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-7xl py-24 mx-auto p-6 min-h-screen bg-gray-50 flex flex-col gap-6">

            {/* Master Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 pb-5">
                <div className="p-2.5 bg-pink-600 rounded-2xl text-white shadow-sm shadow-pink-200">
                    <Receipt className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mess Expenditure Auditor</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage operational outlays and track vendor supply ledger accounts transparently.</p>
                </div>
            </div>

            {/* Split screen content structure */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">

                {/* LHS PANEL: CORE ENTRY FORM CONTAINER BLOCK (60% / 7 Columns) */}
                <form onSubmit={handleSubmitExpense} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                    <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-gray-50">
                        <Landmark className="w-3.5 h-3.5" /> Log Expenditure Parameters
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expense Category:</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 h-10 outline-none focus:ring-2 focus:ring-pink-500 shadow-sm cursor-pointer"
                            >
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Mode:</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 h-10 outline-none focus:ring-2 focus:ring-pink-500 shadow-sm cursor-pointer"
                            >
                                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor / Payee Name:</label>
                            <input
                                type="text"
                                value={supplierName}
                                onChange={(e) => setSupplierName(e.target.value)}
                                placeholder="e.g. Wholesale Mandi Hub"
                                className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 h-10 outline-none focus:border-pink-500 shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Cost Layout Valuation (₹):</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3 text-xs font-bold text-gray-400">₹</span>
                                <input
                                    type="number"
                                    value={totalCost}
                                    onChange={(e) => setTotalCost(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-xl pl-6 pr-3 h-10 outline-none focus:border-pink-500 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voucher Date:</label>
                        <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 h-10">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <input
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                className="w-full bg-transparent border-none text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* ITEM BUILDER PLACED BACK IN MAIN FLOW */}
                    <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl space-y-3">
                        <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5" /> Itemized Invoice Breakdown
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                placeholder="Item name (e.g., Potatoes)"
                                className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 h-9 outline-none focus:border-pink-500 shadow-sm"
                            />
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Qty"
                                    className="w-20 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-2 h-9 outline-none focus:border-pink-500 shadow-sm"
                                />
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="flex-1 bg-white border border-gray-200 text-[11px] font-bold text-gray-600 rounded-xl px-1.5 h-9 outline-none cursor-pointer shadow-sm"
                                >
                                    {INVENTORY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold py-2 shadow transition-colors h-9 flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Item
                            </button>
                        </div>

                        {/* Inline Tags Tray Container */}
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-100 rounded-xl min-h-[50px] items-center">
                            {itemsList.length === 0 ? (
                                <span className="text-[11px] text-gray-400 italic px-1">No explicit tags appended to current voucher.</span>
                            ) : (
                                itemsList.map((item, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-pink-50 text-pink-800 border border-pink-100 rounded-lg"
                                    >
                                        {`${item.itemName} (${item.quantity} ${item.unit})`}
                                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-pink-400 hover:text-pink-600 cursor-pointer">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md uppercase tracking-wider transition-all flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4" /> Save Expense Voucher</>}
                    </button>
                </form>

                {/* RHS PANEL: LIVE ACCOUNTING AUDIT LOGS (40% / 5 Columns) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 max-h-[640px]">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-gray-50">
                        <History className="w-4 h-4 text-pink-500" /> Historical Audit Ledger
                    </span>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-[300px]">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                                <span className="text-xs text-gray-400 font-semibold">Parsing financial records...</span>
                            </div>
                        ) : expenseHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                                <FileText className="w-8 h-8 opacity-30 stroke-[1.5] mb-1" />
                                <span className="text-[11px] italic font-medium">No ledger outputs recorded in database.</span>
                            </div>
                        ) : (
                            expenseHistory.map((exp) => (
                                <div
                                    key={exp._id}
                                    className="p-3.5 bg-gray-50 hover:bg-pink-50/10 border border-gray-100 rounded-xl flex flex-col gap-2 transition-all shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">{exp.supplierName}</span>
                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                {new Date(exp.expenseDate).toLocaleDateString('en-GB')} • {exp.paymentMethod}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-pink-600">₹{exp.totalCost.toLocaleString()}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60">
                                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-gray-200 text-gray-700">
                                            {exp.category}
                                        </span>
                                        {exp.items?.length > 0 && (
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {exp.items.length} item line breakdowns
                                            </span>
                                        )}
                                    </div>

                                    {exp.items?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {exp.items.map((it, i) => (
                                                <span key={i} className="text-[9px] font-semibold bg-white border border-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                                                    {`${it.itemName}: ${it.quantity}${it.unit}`}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default AddExpense