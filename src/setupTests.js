import '@testing-library/jest-dom';

jest.mock('uuid', () => ({ v4: () => 'test-uuid-id', default: { v4: () => 'test-uuid-id' } }));

jest.mock('./supabase/dbService', () => ({
  isSupabaseConfigured: () => false,
  loadAppData: () => Promise.resolve(null),
  saveAppData: () => Promise.resolve(),
  clearAppData: () => Promise.resolve(),
  loadAuthData: () => Promise.resolve(null),
  saveAuthData: () => Promise.resolve(),
}));
