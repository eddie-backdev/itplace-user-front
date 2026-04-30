// store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserInfo = {
  name: string;
  carrier?: string | null;
  membershipGrade?: string | null;
  membershipGradeCode?: string | null;
  membershipVerified?: boolean;
};

type AuthState = {
  isLoggedIn: boolean;
  user: UserInfo | null;
};

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoginSuccess(state, action: PayloadAction<UserInfo>) {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.user = null;
    },
  },
});

export const { setLoginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
