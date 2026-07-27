import { createSlice } from "@reduxjs/toolkit";

const menuSlice = createSlice({
    name: "menu",
    initialState: {
        menu: [],        
        attendance: null,     
        selectedDate: new Date().toISOString().split('T')[0], 
    },
    reducers: {
        // Sets the entire weekly menu populated by managers
        setMenu: (state, action) => {
            state.menu = action.payload;
        },

        // Sets or updates the active student's meal tracking metrics for the chosen day
        setAttendance: (state, action) => {
            state.attendance = action.payload;
        },

        // Updates the system calendar view focal point day (e.g., "2026-06-24")
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },

        // Clears transactional data safely on user logout
        clearMenuState: (state) => {
            state.menu = [];
            state.attendance = null;
            state.selectedDate = new Date().toISOString().split('T')[0];
        }
    },
});

export const { setMenu, setAttendance, setSelectedDate, clearMenuState } = menuSlice.actions;
export default menuSlice.reducer;