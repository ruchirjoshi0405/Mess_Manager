import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FINANCE_API_END_POINT } from '@/utils/constants'
import axios from 'axios'
import { AreaChart as ChartIcon, Users, Utensils, Receipt, IndianRupee, ArrowUpRight, ShieldCheck } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

const Financials = () => {
  const [stats, setStats] = useState({
    totalRegisteredStudents: 0,
    totalCollectionsFees: 0,
    totalSpentOperations: 0,
    netReserveBalance: 0,
    breakdownByCategory: []
  })

  const fetchStats = async () => {
    const accessToken = localStorage.getItem('accessToken')
    try {
      const res = await axios.get(`${FINANCE_API_END_POINT}/dashboard/analytics`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      if (res.data.success) {
        // FIXED: Mapping directly to your custom backend response object structure
        setStats({
          totalRegisteredStudents: res.data.metrics.totalRegisteredStudents || 0,
          totalCollectionsFees: res.data.metrics.totalCollectionsFees || 0,
          totalSpentOperations: res.data.metrics.totalSpentOperations || 0,
          netReserveBalance: res.data.metrics.netReserveBalance || 0,
          breakdownByCategory: res.data.breakdownByCategory || []
        })
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching financial analytics data")
      console.error('Error fetching analytics:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className='w-full max-w-6xl py-24 mx-auto p-4 flex flex-col gap-6 min-h-screen'>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Financials & Revenue Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor portal registration metrics, ledger processing states, and subscription balances.</p>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='bg-white shadow-sm border border-gray-100 p-2 rounded-2xl'>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">Registered Students</CardTitle>
            <Users className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent className='text-3xl font-black text-gray-900'>{stats.totalRegisteredStudents}</CardContent>
        </Card>

        <Card className='bg-white shadow-sm border border-gray-100 p-2 rounded-2xl'>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">Total Revenue Fees</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className='text-3xl font-black text-emerald-600'>
            ₹{stats.totalCollectionsFees?.toLocaleString("en-IN")}
          </CardContent>
        </Card>

        <Card className='bg-white shadow-sm border border-gray-100 p-2 rounded-2xl'>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">Operational Expenses</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent className='text-3xl font-black text-rose-600'>
            ₹{stats.totalSpentOperations?.toLocaleString("en-IN")}
          </CardContent>
        </Card>

        <Card className={`text-white shadow-sm border-none p-2 rounded-2xl bg-gradient-to-br ${stats.netReserveBalance >= 0 ? 'from-emerald-600 to-emerald-700' : 'from-rose-600 to-rose-700'}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium opacity-90">Net Reserve Balance</CardTitle>
            <ShieldCheck className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent className='text-3xl font-black'>
            ₹{stats.netReserveBalance?.toLocaleString("en-IN")}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Graph Card */}
      <Card className='w-full bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden'>
        <CardHeader className="flex flex-row items-center gap-2 bg-gray-50/50 border-b border-gray-100 py-4 px-6">
          <ChartIcon className="h-5 w-5 text-pink-600" />
          <CardTitle className="text-lg font-bold text-gray-800">Fee Collections (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[380px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesByDate || []} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  className="text-xs font-semibold text-gray-400"
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  className="text-xs font-semibold text-gray-400"
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  tickFormatter={(val) => `₹${val}`}
                />

                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, 'Amount Collected']}
                  contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#db2777"
                  fillOpacity={0.1}
                  fill="#db2777"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Financials;