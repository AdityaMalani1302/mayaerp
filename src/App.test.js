import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./supabase/dbService', () => ({
  isSupabaseConfigured: () => false,
  loadAppData: () => Promise.resolve(null),
  saveAppData: () => Promise.resolve(),
  clearAppData: () => Promise.resolve(),
  loadAuthData: () => Promise.resolve(null),
  saveAuthData: () => Promise.resolve(),
}));

test('renders login page', () => {
  render(<App />);
  const heading = screen.getByText(/MayaSoft ERP/i);
  expect(heading).toBeInTheDocument();
});
