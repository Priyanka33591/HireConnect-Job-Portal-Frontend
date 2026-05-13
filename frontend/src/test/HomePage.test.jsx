import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/profiles', () => ({
  getProfileByUserId: vi.fn(() => Promise.resolve({ fullName: 'Test User' })),
}));

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders landing page content', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/HireConnect job portal for candidates and recruiters/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse jobs/i)).toBeInTheDocument();
  });

  it('shows Login button when not authenticated', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Login \/ Register/i)).toBeInTheDocument();
  });

  it('hides Login button when authenticated', () => {
    localStorage.setItem('hc_access_token', 'fake-token');
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    expect(screen.queryByText(/Login \/ Register/i)).not.toBeInTheDocument();
  });
});
