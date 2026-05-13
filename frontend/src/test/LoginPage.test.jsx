import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API calls
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('../api/profiles', () => ({
  getProfileByUserId: vi.fn(() => Promise.resolve({ fullName: 'Test User' })),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form by default', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(document.getElementById('btn-submit')).toBeInTheDocument();
  });

  it('switches to register mode', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    
    const registerTab = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(registerTab);
    
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
  });

  it('updates email and password fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/Min 8 characters/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
