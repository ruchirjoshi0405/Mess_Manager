import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Utensils, Plus, Edit2, X, Check, Landmark, Star } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { setMenu } from '@/redux/menuSlice'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']

function ManageWeeklyMenu() {
    const token = localStorage.getItem('accessToken')
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)
    const { user } = useSelector(state => state.user)
    const dispatch = useDispatch()

    // Two-key matrix state tracking the current active edit point ("Wednesday-Snacks")
    const [editingKey, setEditingKey] = useState(null)
    
    // Controlled parameters for the active layout modifier form
    const [inputItems, setInputItems] = useState("")
    const [inputCost, setInputCost] = useState(0)

    // Matrix structuring the complete week configuration state values
    const [weeklyMenu, setWeeklyMenu] = useState({
        Monday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
        Tuesday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
        Wednesday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
        Thursday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
        Friday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
        Saturday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
        Sunday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null }
    })

    // 🟢 UPDATED: Pointing to the aggregate transaction route endpoint
    const fetchWeeklyMenuData = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${import.meta.env.VITE_URL}/api/v1/menu/getWeeklyMenuWithRatings`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            const baselineMatrix = {
                Monday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
                Tuesday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
                Wednesday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
                Thursday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
                Friday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
                Saturday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null },
                Sunday: { Breakfast: null, Lunch: null, Snacks: null, Dinner: null }
            }

            if (res.data.success && res.data.menu) {
                res.data.menu.forEach(item => {
                    if (baselineMatrix[item.day] && baselineMatrix[item.day][item.mealType] !== undefined) {
                        baselineMatrix[item.day][item.mealType] = {
                            foodString: item.items.join(", "),
                            costPerPerson: item.costPerPerson || 0,
                            averageRating: item.averageRating || 0, // 🟢 Injected metric parameter mapping
                            ratingCount: item.ratingCount || 0,
                            id: item._id
                        }
                    }
                })
                dispatch(setMenu(res.data.menu))
            }
            setWeeklyMenu(baselineMatrix)
        } catch (error) {
            console.error(error)
            toast.error("Failed to compile weekly calendar database schedules.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchWeeklyMenuData()
    }, [])

    const startInlineEditing = (day, slot, dynamicCurrentRecord) => {
        setEditingKey(`${day}-${slot}`)
        setInputItems(dynamicCurrentRecord ? dynamicCurrentRecord.foodString : "")
        setInputCost(dynamicCurrentRecord ? dynamicCurrentRecord.costPerPerson : 0)
    }

    const saveInlineSlotChanges = async (day, slot) => {
        if (!inputItems.trim()) {
            toast.error("Please add item values before saving.")
            return
        }

        const currentKeyToken = `${day}-${slot}`
        try {
            setActionLoading(currentKeyToken)
            const targetedArrayPayload = inputItems.split(',').map(i => i.trim()).filter(Boolean)

            const res = await axios.post(`${import.meta.env.VITE_URL}/api/v1/menu/add`, {
                day,
                mealType: slot,
                items: targetedArrayPayload,
                costPerPerson: Number(inputCost)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                // Re-trigger history logs fetch to pull down and retain updated average counts cleanly
                await fetchWeeklyMenuData()
                setEditingKey(null)
                toast.success(`${day} ${slot} updated successfully!`)
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to submit new menu profile changes.")
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-pink-600 mb-2" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Compiling Full Week Grid...</p>
            </div>
        )
    }

    return (
        <div className="my-20 pt-16 min-h-screen bg-gray-50 p-4 md:p-8 w-full flex flex-col items-center">
            <div className="max-w-[1600px] w-full space-y-8">
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <Landmark className="w-6 h-6 text-pink-600" /> Complete Weekly Mess Schedule Manager
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">Full-view master dashboard panel layout built to control, edit, and adjust meal entries inline instantly.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col lg:flex-row gap-4 lg:items-center">
                            
                            <div className="lg:w-36 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 pb-2 lg:pb-0 lg:pr-4">
                                <h2 className="text-lg font-black text-gray-900 tracking-wide uppercase">{day}</h2>
                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">4 Daily Slots</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
                                {MEAL_TYPES.map((slot) => {
                                    const mealRecord = weeklyMenu[day][slot]
                                    const currentUniqueKey = `${day}-${slot}`
                                    const isEditingThisCard = editingKey === currentUniqueKey

                                    return (
                                        <div 
                                            key={slot} 
                                            className={`border rounded-xl p-4 transition-all flex flex-col justify-between min-h-[155px] relative ${
                                                isEditingThisCard 
                                                    ? 'border-pink-300 bg-pink-50/10 shadow-inner' 
                                                    : mealRecord 
                                                        ? 'border-gray-100 bg-gray-50/30 hover:shadow-sm' 
                                                        : 'border-dashed border-gray-200 bg-white' 
                                            }`}
                                        >
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-1.5 mb-2">
                                                <span className="text-xs font-black uppercase text-gray-500 flex items-center gap-1">
                                                    <Utensils className="w-3 h-3 text-pink-500" /> {slot}
                                                </span>

                                                {user.role !== 'student' && !isEditingThisCard && (
                                                    <button
                                                        onClick={() => startInlineEditing(day, slot, mealRecord)}
                                                        className="text-gray-400 hover:text-pink-600 transition-colors p-0.5 rounded hover:bg-pink-50 cursor-pointer"
                                                    >
                                                        {mealRecord ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingThisCard ? (
                                                <div className="space-y-2 w-full flex-1 flex flex-col justify-between">
                                                    <div className="space-y-1.5">
                                                        <textarea
                                                            value={inputItems}
                                                            onChange={(e) => setInputItems(e.target.value)}
                                                            placeholder="Split items with commas..."
                                                            className="w-full text-[11px] p-1.5 border border-gray-200 bg-white rounded-md outline-none focus:border-pink-500 resize-none h-12 text-gray-700"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Cost: ₹</span>
                                                            <input
                                                                type="number"
                                                                value={inputCost}
                                                                onChange={(e) => setInputCost(e.target.value)}
                                                                className="w-16 text-[11px] px-1 py-0.5 border border-gray-200 bg-white rounded outline-none focus:border-pink-500 h-5"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-1 border-t border-gray-100 pt-1.5 mt-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setEditingKey(null)}
                                                            className="h-6 text-[10px] font-bold px-2 rounded cursor-pointer border-gray-200 text-gray-500"
                                                        >
                                                            <X className="w-2.5 h-2.5 mr-0.5" /> Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            disabled={actionLoading === currentUniqueKey}
                                                            onClick={() => saveInlineSlotChanges(day, slot)}
                                                            className="h-6 text-[10px] font-bold px-2 bg-pink-600 hover:bg-pink-700 text-white rounded cursor-pointer"
                                                        >
                                                            {actionLoading === currentUniqueKey ? (
                                                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                            ) : (
                                                                <><Check className="w-2.5 h-2.5 mr-0.5" /> Save</>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col justify-between flex-1">
                                                    <p className={`text-xs italic leading-relaxed line-clamp-2 ${mealRecord ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                                                        {mealRecord ? `"${mealRecord.foodString}"` : "Empty Slot Setup Required"}
                                                    </p>
                                                    
                                                    {mealRecord ? (
                                                        <div className="text-[10px] text-gray-400 font-bold tracking-wide mt-2 border-t border-gray-50 pt-1.5 flex justify-between items-center">
                                                            <span>EST. RATE: <span className="text-gray-700 font-black text-xs">₹{mealRecord.costPerPerson}</span></span>
                                                            
                                                            {/* 🟢 NEW: Integrated Student Live Ratings Feedback Badge */}
                                                            {mealRecord.ratingCount > 0 ? (
                                                                <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100 text-[9px]">
                                                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                                                    {mealRecord.averageRating} ({mealRecord.ratingCount})
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] text-gray-300 font-normal italic lowercase tracking-normal">no ratings</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => startInlineEditing(day, slot, mealRecord)}
                                                            className="text-[10px] text-left text-pink-500 font-bold hover:text-pink-700 transition-colors mt-2 cursor-pointer inline-flex items-center gap-0.5"
                                                        >
                                                            <Plus className="w-2.5 h-2.5" /> Setup Menu
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ManageWeeklyMenu