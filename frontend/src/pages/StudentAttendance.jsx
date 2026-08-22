import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Utensils, CheckCircle, XCircle, Calendar, Lock, Star, CalendarDays, X } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { setAttendance, setMenu } from '@/redux/menuSlice'
import { MESS_API_END_POINT, ATTENDANCE_API_END_POINT } from '@/utils/constants'

const MEAL_CUTOFF_HOURS = {
    breakfast: 8,  // 8:00 AM
    lunch: 12,     // 12:00 PM
    snacks: 16,    // 4:00 PM
    dinner: 20     // 8:00 PM
}

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function StudentAttendance() {
    const dispatch = useDispatch()
    const { user } = useSelector((store) => store.user)
    const token = localStorage.getItem('accessToken')

    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)

    const [isFullDayLeave, setIsFullDayLeave] = useState(false)
    const [meals, setMeals] = useState({
        breakfast: { eating: true, food: "Not updated yet", rating: null },
        lunch: { eating: true, food: "Not updated yet", rating: null },
        snacks: { eating: true, food: "Not updated yet", rating: null },
        dinner: { eating: true, food: "Not updated yet", rating: null }
    })

    // 🟢 NEW: State tracking weekly full schedule modal configurations
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
    const [weeklyMenu, setWeeklyMenu] = useState(null)
    const [menuLoading, setMenuLoading] = useState(false)

    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const MEAL_SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner']

    // 🟢 NEW: Asynchronous parser compiling full weekly database rows
    const handleOpenMenuModal = async () => {
        setIsMenuModalOpen(true)
        try {
            setMenuLoading(true)

            const res = await axios.get(`${MESS_API_END_POINT}/getMenu`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const baselineMatrix = {
                Monday: { breakfast: null, lunch: null, snacks: null, dinner: null },
                Tuesday: { breakfast: null, lunch: null, snacks: null, dinner: null },
                Wednesday: { breakfast: null, lunch: null, snacks: null, dinner: null },
                Thursday: { breakfast: null, lunch: null, snacks: null, dinner: null },
                Friday: { breakfast: null, lunch: null, snacks: null, dinner: null },
                Saturday: { breakfast: null, lunch: null, snacks: null, dinner: null },
                Sunday: { breakfast: null, lunch: null, snacks: null, dinner: null }
            }

            if (res.data.success && res.data.menu) {
                console.log("res.data.menu:", res.data.menu);
                res.data.menu.forEach(item => {
                    if (baselineMatrix[item.day] && baselineMatrix[item.day][item.mealType] !== undefined) {
                        baselineMatrix[item.day][item.mealType] = {
                            foodString: item.items.join(", ")
                        }
                    }
                })
            }
            setWeeklyMenu(baselineMatrix)
        } catch (error) {
            console.error(error)
            toast.error("Failed to compile weekly menu matrix.")
        } finally {
            setMenuLoading(false)
        }
    }

    const getSystemDateStrings = () => {
        const todayStr = new Date().toLocaleDateString('en-CA')
        const [year, month, day] = date.split('-').map(Number)
        return {
            isPastDate: date < todayStr,
            isToday: date === todayStr
        }
    }

    const { isPastDate, isToday } = getSystemDateStrings()

    const getDatesForCurrentWeek = () => {
        const [year, month, day] = date.split('-').map(Number)
        const currentSelected = new Date(year, month - 1, day)
        const currentDayOfWeek = currentSelected.getDay()

        return WEEKDAYS_SHORT.map((_, index) => {
            const offsetDate = new Date(currentSelected)
            offsetDate.setDate(currentSelected.getDate() - currentDayOfWeek + index)
            return {
                dayName: WEEKDAYS_SHORT[index],
                dateString: offsetDate.toLocaleDateString('en-CA'),
                dayOfMonth: offsetDate.getDate()
            }
        })
    }

    const weekStripDays = getDatesForCurrentWeek()

    const handleWeekdaySelect = (targetDateString) => {
        setDate(targetDateString)
    }

    const fetchDailyData = async (targetDate) => {
        try {
            setLoading(true)
            const menuRes = await axios.get(`${MESS_API_END_POINT}/getMenu?date=${targetDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log("menuRes:", menuRes);
            const attendanceRes = await axios.get(`${ATTENDANCE_API_END_POINT}/view?date=${targetDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const updatedMeals = {
                breakfast: { eating: true, food: "No menu added", rating: null },
                lunch: { eating: true, food: "No menu added", rating: null },
                snacks: { eating: true, food: "No menu added", rating: null },
                dinner: { eating: true, food: "No menu added", rating: null }
            }

            if (menuRes.data.success && menuRes.data.menu) {
                menuRes.data.menu.forEach(item => {
                    if (updatedMeals[item.mealType]) {
                        updatedMeals[item.mealType].food = item.items.join(", ")
                    }
                })
                dispatch(setMenu(menuRes.data.menu))
            }

            if (attendanceRes.data.success && attendanceRes.data.attendance) {
                const att = attendanceRes.data.attendance
                setIsFullDayLeave(att.isFullDayLeave || false)

                Object.keys(updatedMeals).forEach(slot => {
                    const mealData = att.meals?.[slot.toLowerCase()];
                    if (mealData && mealData.status !== undefined) {
                        updatedMeals[slot].eating = mealData.status === 'eating';
                        updatedMeals[slot].rating = mealData.rating || null;
                    }
                })
                dispatch(setAttendance(att))
            } else {
                setIsFullDayLeave(false)
            }
            setMeals(updatedMeals)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load daily dashboard data.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchDailyData(date)
    }, [date])

    const handleMealToggle = async (mealSlot) => {
        if (isPastDate) return
        const currentHour = new Date().getHours()
        if (isToday && currentHour >= MEAL_CUTOFF_HOURS[mealSlot]) return

        try {
            setActionLoading(mealSlot)
            const targetStatus = !meals[mealSlot].eating
            const res = await axios.put(`${ATTENDANCE_API_END_POINT}/update-meal`, {
                date,
                mealType: mealSlot,
                status: targetStatus ? 'eating' : 'skipping'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                setMeals(prev => ({ ...prev, [mealSlot]: { ...prev[mealSlot], eating: targetStatus } }))
                toast.success(`${mealSlot} status updated cleanly!`)
            }
        } catch (error) {
            toast.error("Failed to update choices.")
        } finally {
            setActionLoading(null)
        }
    }

    const handleRateMeal = async (mealSlot, ratingValue) => {
        try {
            console.log({ date, mealType: mealSlot.toLowerCase(), rating: ratingValue });
            const res = await axios.put(`${ATTENDANCE_API_END_POINT}/rate-meal`, {
                date,
                mealType: mealSlot.toLowerCase(),
                rating: ratingValue
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                setMeals(prev => ({ ...prev, [mealSlot]: { ...prev[mealSlot], rating: ratingValue } }))
                toast.success(`Thank you for rating ${mealSlot}!`)
            }
        } catch (error) {
            toast.error("Failed to save rating metrics.")
        }
    }

    const handleFullDayLeaveToggle = async () => {
        if (isPastDate) return
        try {
            setLoading(true)
            const targetLeaveStatus = !isFullDayLeave
            const res = await axios.put(`${ATTENDANCE_API_END_POINT}/toggle-leave`, {
                date,
                isOnLeave: targetLeaveStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                setIsFullDayLeave(targetLeaveStatus)
                setMeals(prev => {
                    const updated = { ...prev }
                    Object.keys(updated).forEach(slot => {
                        updated[slot].eating = !targetLeaveStatus
                        if (targetLeaveStatus) updated[slot].rating = null
                    })
                    return updated
                })
                toast.success(targetLeaveStatus ? "Full Day Leave activated!" : "Leave cancelled.")
            }
        } catch (error) {
            toast.error("Failed to alter leave metrics.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="my-20 pt-24 min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center relative">
            <div className="max-w-4xl w-full space-y-6">

                {/* Greeting Header Container with Dynamic Menu Trigger Button */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.firstName}!</h1>
                        <p className="text-sm text-gray-500">Hostel: <span className="font-semibold">{user?.hostelName}</span> | Room: <span className="font-semibold">{user?.roomNumber}</span></p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        {/* 🟢 NEW: Secondary action toggle displaying the weekly timeline matrix popup */}
                        <button
                            onClick={handleOpenMenuModal}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer h-9"
                        >
                            <CalendarDays className="w-4 h-4" /> View Weekly Menu
                        </button>

                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl border border-gray-200 h-9">
                            <Calendar className="w-4 h-4 text-gray-500 ml-1" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none text-sm font-semibold text-gray-700 outline-none cursor-pointer pr-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Day Switcher Strips */}
                <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full grid grid-cols-7 gap-1">
                    {weekStripDays.map((item) => {
                        const isCurrentSelection = item.dateString === date
                        const todayString = new Date().toLocaleDateString('en-CA')
                        const isStripDayToday = item.dateString === todayString
                        const isStripDayPast = item.dateString < todayString

                        return (
                            <button
                                key={item.dateString}
                                onClick={() => handleWeekdaySelect(item.dateString)}
                                className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer border ${isCurrentSelection
                                    ? 'bg-pink-600 text-white border-transparent font-bold shadow-md scale-102'
                                    : isStripDayPast
                                        ? 'bg-gray-50/50 text-gray-400 border-transparent opacity-60 blur-[0.4px]'
                                        : 'bg-transparent text-gray-600 border-transparent hover:bg-pink-50/50 hover:text-pink-600'
                                    }`}
                            >
                                <span className={`text-[11px] uppercase tracking-wider ${isCurrentSelection ? 'text-pink-100' : 'text-gray-400 font-medium'}`}>
                                    {item.dayName}
                                </span>
                                <span className="text-lg font-black mt-0.5 relative">
                                    {item.dayOfMonth}
                                    {isStripDayToday && !isCurrentSelection && (
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-600 rounded-full" />
                                    )}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Leave Toggle Widgets */}
                <Card className={`border transition-all rounded-2xl shadow-sm ${isPastDate ? 'border-gray-200 bg-gray-100/50' : isFullDayLeave ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white'}`}>
                    <CardContent className="flex justify-between items-center py-4 px-6">
                        <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                                Full Day Leave {isPastDate && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                            </h3>
                            <p className="text-xs text-gray-500">Turn this ON to declare absence from all mess meals for this entire selected calendar day.</p>
                        </div>
                        <Button
                            onClick={handleFullDayLeaveToggle}
                            disabled={loading || isPastDate}
                            className={`font-semibold rounded-xl px-4 transition-all shadow-sm cursor-pointer ${isPastDate ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : isFullDayLeave ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                            {isPastDate ? "Locked" : isFullDayLeave ? "Mark Presence" : "Mark Absence"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Daily Meals Grids */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(meals).map((slot) => {
                            const isEating = meals[slot].eating
                            const currentRating = meals[slot].rating || 0
                            const currentHour = new Date().getHours()
                            const isMealCutoffPassed = isToday && currentHour >= MEAL_CUTOFF_HOURS[slot]
                            const isSlotLocked = isPastDate || isMealCutoffPassed
                            const isMealServed = isPastDate || (isToday && currentHour >= MEAL_CUTOFF_HOURS[slot])
                            const canSubmitRating = isEating && !isFullDayLeave && isMealServed

                            return (
                                <Card key={slot} className={`border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white hover:shadow-md transition-all relative ${isSlotLocked ? "opacity-95 bg-gray-50/30 select-none" : ""}`}>
                                    <CardHeader className="flex flex-row justify-between items-center bg-gray-50/50 py-3 px-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Utensils className="w-4 h-4 text-pink-500" />
                                            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-1">
                                                {slot} {isSlotLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                                            </CardTitle>
                                        </div>
                                        {isEating ? (
                                            <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Eating
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                                                <XCircle className="w-3 h-3 mr-1" /> Skipping
                                            </span>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-5 flex flex-col justify-between min-h-[160px]">
                                        <div>
                                            <p className="text-sm text-gray-600 italic line-clamp-2 mb-3">
                                                "{meals[slot].food}"
                                            </p>
                                            <div className={`flex items-center gap-1 border-t border-gray-50 pt-3 mt-2 transition-all ${!canSubmitRating ? "opacity-30 blur-[0.4px] cursor-not-allowed" : ""}`}>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">
                                                    {isMealServed ? "Rate Meal:" : "Rating Opens Later:"}
                                                </span>
                                                {[1, 2, 3, 4, 5].map((starValue) => (
                                                    <button
                                                        key={starValue}
                                                        type="button"
                                                        disabled={!canSubmitRating}
                                                        onClick={() => handleRateMeal(slot, starValue)}
                                                        className="transition-transform duration-100 cursor-pointer disabled:cursor-not-allowed active:scale-95 z-10"
                                                    >
                                                        <Star className={`w-4 h-4 transition-colors ${starValue <= currentRating ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button
                                                onClick={() => handleMealToggle(slot)}
                                                disabled={actionLoading === slot || isFullDayLeave || isSlotLocked}
                                                className={`text-xs font-semibold rounded-lg px-3 py-1 h-8 cursor-pointer shadow-sm border ${isSlotLocked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : isEating ? 'bg-white text-red-600 border-red-200 hover:bg-red-50' : 'bg-pink-600 text-white border-transparent hover:bg-pink-700'}`}
                                            >
                                                {actionLoading === slot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isSlotLocked ? "Closed" : isEating ? "Skip Meal" : "Opt In"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* 🟢 NEW: CHROMATIC VIEWPORT WEEKLY MENU MODAL DISPLAY PANELS OVERLAY */}
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div onClick={() => setIsMenuModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm cursor-pointer" />

                    <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 z-10">

                        {/* Modal Heading Context Bar */}
                        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-900">
                                <Utensils className="w-4 h-4 text-pink-600" />
                                <h3 className="text-sm font-black uppercase tracking-wider">Weekly Mess Schedule Matrix</h3>
                            </div>
                            <button
                                onClick={() => setIsMenuModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Timetable Scroll/Viewport View wrapper container */}
                        <div className="p-6 overflow-x-auto bg-gray-50/40 flex-1">
                            {menuLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                                    <span className="text-xs text-gray-400 font-semibold tracking-wide">Compiling timetable database matrix...</span>
                                </div>
                            ) : !weeklyMenu ? (
                                <p className="text-center text-xs text-gray-400 italic py-20">No menu data allocated in database.</p>
                            ) : (
                                <div className="min-w-[850px] overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                                    <table className="w-full text-left table-fixed divide-y divide-gray-200">

                                        {/* Column Headers: Meal Slots across the top */}
                                        <thead className="bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3.5 w-[120px] bg-gray-100/60 border-r border-gray-200 text-pink-600 font-bold">Day of Week</th>
                                                {MEAL_SLOTS.map(slot => (
                                                    <th key={slot} className="px-4 py-3.5 text-center border-r border-gray-200 last:border-r-0">
                                                        {slot}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        {/* Rows: Iterating through Days down the left column */}
                                        <tbody className="divide-y divide-gray-200 text-[11px] text-gray-600">
                                            {DAYS_OF_WEEK.map(day => (
                                                <tr key={day} className="hover:bg-gray-50/40 transition-colors">

                                                    {/* Row Identity Sidebar header element for the Day */}
                                                    <td className="px-4 py-4 bg-gray-50/50 font-bold text-gray-900 border-r border-gray-200 text-xs tracking-tight align-middle">
                                                        {day}
                                                    </td>

                                                    {/* Cells: Mapping out each meal slot for the active row day */}
                                                    {MEAL_SLOTS.map(slot => {
                                                        const mealItem = weeklyMenu[day]?.[slot]
                                                        return (
                                                            <td
                                                                key={`${day}-${slot}`}
                                                                className="px-4 py-3 border-r border-gray-200 last:border-r-0 font-medium leading-relaxed align-top min-h-[75px]"
                                                            >
                                                                {mealItem?.foodString ? (
                                                                    <div className="pt-0.5">
                                                                        <p className="text-gray-800 font-semibold text-[11px]">
                                                                            {mealItem.foodString}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-300 italic font-normal tracking-wide block pt-0.5">
                                                                        Not scheduled
                                                                    </span>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}

export default StudentAttendance