import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { User, UserRole } from '@/types';
import { authApi } from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const userInfo = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => userInfo.value?.role === UserRole.ADMIN);
  const isClubLeader = computed(
    () => userInfo.value?.role === UserRole.CLUB_LEADER,
  );
  const isMember = computed(() => userInfo.value?.role === UserRole.MEMBER);

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };

  const setUserInfo = (user: User) => {
    userInfo.value = user;
  };

  const login = async (username: string, password: string) => {
    const result = await authApi.login({ username, password });
    setToken(result.access_token);
    setUserInfo(result.user);
    return result;
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
  };

  const fetchUserInfo = async () => {
    if (!token.value) return;
    try {
      const user = await authApi.getProfile();
      setUserInfo(user as User);
    } catch (error) {
      logout();
    }
  };

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    isClubLeader,
    isMember,
    setToken,
    setUserInfo,
    login,
    logout,
    fetchUserInfo,
  };
});
