import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillUpAdminLockScreen } from '../SkillUpAdminLockScreen';

describe('SkillUpAdminLockScreen Adapter (SUIA Compatibility)', () => {
  const mockUser = {
    id: 'suia-admin-1',
    email: 'counsellor@skillupitacademy.com',
    name: 'SkillUp Staff',
    role: 'admin',
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remains inactive and returns null by default (safety: unapproved policy not activated)', () => {
    const { container } = render(<SkillUpAdminLockScreen user={mockUser} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null if user is not provided even if isLocked is true', () => {
    const { container } = render(<SkillUpAdminLockScreen isLocked={true} user={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders cyan-themed SkillUp lock screen when explicitly activated with valid user', () => {
    render(
      <SkillUpAdminLockScreen
        isLocked={true}
        user={mockUser}
      />
    );

    expect(screen.getByText('Terminal Locked')).toBeInTheDocument();
    expect(screen.getByText('SkillUp Security Protocol')).toBeInTheDocument();
    expect(screen.getByText('counsellor@skillupitacademy.com')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    expect(submitBtn.className).toContain('from-[#0891B2]');
    expect(submitBtn.className).toContain('to-[#06B6D4]');
  });

  it('invokes onUnlock when password is submitted', async () => {
    const onUnlock = vi.fn().mockResolvedValue(undefined);
    render(
      <SkillUpAdminLockScreen
        isLocked={true}
        user={mockUser}
        onUnlock={onUnlock}
      />
    );

    const input = screen.getByLabelText(/account password/i);
    fireEvent.change(input, { target: { value: 'StaffSecret123' } });

    const submitBtn = screen.getByRole('button', { name: /unlock terminal/i });
    fireEvent.click(submitBtn);

    expect(onUnlock).toHaveBeenCalledWith('StaffSecret123');
  });
});
