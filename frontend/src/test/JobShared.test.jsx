import { describe, it, expect } from 'vitest';
import { fmtSalary, timeAgo, initials } from '../components/JobShared';

describe('JobShared Helpers', () => {
  describe('fmtSalary', () => {
    it('formats salary correctly', () => {
      expect(fmtSalary(100000)).toBe('1,00,000');
    });

    it('returns null for empty input', () => {
      expect(fmtSalary(null)).toBeNull();
    });
  });

  describe('timeAgo', () => {
    it('returns "Today" for current date', () => {
      const today = new Date().toISOString();
      expect(timeAgo(today)).toBe('Today');
    });

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      expect(timeAgo(yesterday)).toBe('Yesterday');
    });
  });

  describe('initials', () => {
    it('returns correct initials', () => {
      expect(initials('Software Engineer')).toBe('SE');
    });

    it('returns single initial for one word', () => {
      expect(initials('Engineer')).toBe('E');
    });
  });
});
