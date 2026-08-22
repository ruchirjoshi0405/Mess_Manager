import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Utensils, Users, XCircle, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ATTENDANCE_API_END_POINT } from '@/utils/constants';

const Headcounts = () => {
  const [headcounts, setHeadcounts] = useState({
    Breakfast: { eating: 0, skipping: 0 },
    Lunch: { eating: 0, skipping: 0 },
    Snacks: { eating: 0, skipping: 0 },
    Dinner: { eating: 0, skipping: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const accessToken = localStorage.getItem("accessToken");

  const fetchHeadcounts = async (date) => {
    try {
      setLoading(true);
      // Calls your new attendance analytics summary endpoint
      const { data } = await axios.get(`${ATTENDANCE_API_END_POINT}/headcount?date=${date}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (data.success) {
        console.log("data.headcounts:", data.headcounts);
        setHeadcounts(data.headcounts);

      }
    } catch (error) {
      console.error("❌ Failed to fetch meal headcounts:", error);
      toast.error("Could not load real-time headcounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadcounts(selectedDate);
  }, [selectedDate, accessToken]);

  return (
    <div className="w-full px-4 py-24 max-w-6xl mx-auto">
      {/* Upper Control Bar Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kitchen Headcount Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time portion counts to optimize grocery procurement and preparation volumes.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Calendar Selector */}
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-gray-700 outline-none cursor-pointer"
            />
          </div>
          {/* Refresh Tool */}
          <button
            onClick={() => fetchHeadcounts(selectedDate)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer text-gray-600"
            title="Refresh headcount"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      ) : (
        /* Summary Metric Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(headcounts).map((mealSlot) => {
            const { eating, skipping } = headcounts[mealSlot];
            const totalExpected = eating + skipping;
            // Guard against divide-by-zero if no students are assigned yet
            const eatingPercentage = totalExpected > 0 ? Math.round((eating / totalExpected) * 100) : 0;

            return (
              <Card key={mealSlot} className="border border-gray-100 rounded-2xl shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                  <div className="flex items-center gap-2 text-pink-600">
                    <Utensils className="w-4 h-4" />
                    <CardTitle className="text-lg font-bold text-gray-800">{mealSlot}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Active Count Row */}
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">Portions to Cook</span>
                    </div>
                    <span className="text-2xl font-black text-green-700">{eating}</span>
                  </div>

                  {/* Absences / Skipping Row */}
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-2 text-red-500">
                      <XCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Opted Out / Leaves</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{skipping}</span>
                  </div>

                  {/* Visual Utilization Gauge */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5 font-medium">
                      <span>Attendance Rate</span>
                      <span className="text-gray-700 font-semibold">{eatingPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${eatingPercentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Headcounts;