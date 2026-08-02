import { create } from "zustand";
import toast from "react-hot-toast";
import { getUserProfile, logoutUser, refreshAccessToken } from "../utils/apiServices";

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  
  loadingUser: true,

  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  // Used by apiClient.js's response interceptor after a silent refresh --
  // deliberately leaves `user` untouched, unlike setAuth.
  setAccessToken: (accessToken) => set({ accessToken }),
  // Merges a partial user update (e.g. the self-service profile form's
  // response) into the existing user object -- unlike setAuth, preserves
  // fields the update response doesn't include (roles, department, unit,
  // position, permissions).
  updateUser: (partialUser) => set((state) => ({ user: { ...state.user, ...partialUser } })),


  fetchUserProfile: async () => {
    // App.jsx fires this once on mount, unconditionally, to silently
    // restore a session from the httpOnly refresh cookie -- with no
    // accessToken yet, that's a slow round trip. If a user logs in (which
    // sets a real token synchronously via setAuth) before this in-flight
    // call resolves, its result is stale: every write below is guarded
    // against the store's accessToken having moved on since `tokenAtStart`,
    // so a late-arriving anonymous probe can never clobber a session a
    // faster, more authoritative call already established.
    const tokenAtStart = get().accessToken;
    set({ loadingUser: true });
    try {
      let token = tokenAtStart;

      if (!token) {
        const { data } = await refreshAccessToken();
        token = data.data.accessToken;

        if (get().accessToken && get().accessToken !== tokenAtStart) {
          return; // someone else already established a session while we waited
        }
        set({ accessToken: token });
      }

      const { data } = await getUserProfile(token);
      if (data.success && get().accessToken === token) {
        set({ user: data.data });
      }
    } catch {
      if (get().accessToken === tokenAtStart) {
        set({ user: null, accessToken: null });
      }
    } finally {
      set({ loadingUser: false });
    }
  },

  logout: async () => {
    const { accessToken } = get();
    try {
      if (accessToken) {
        const { data } = await logoutUser(accessToken);
        if (data?.message) toast.success(data.message);
      }
    } catch (error) {
      console.error("Logout failed:", error?.response?.data || error.message);
    } finally {
      set({ user: null, accessToken: null });
    }
  },
}));

export default useAuthStore;
