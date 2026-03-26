import { apiClient } from '@quiz/api-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserCreateWizard } from '../UserCreateWizard';

const createUserMock = vi.mocked(apiClient.user.createUser);

// Mock the API client
vi.mock('@quiz/api-client', () => ({
    apiClient: {
        user: {
            createUser: vi.fn(),
        },
    },
}));

// Mock clientLogger
vi.mock('@/utils/clientLogger', () => ({
    clientLogger: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

// Mock createPortal since we are in a test environment
vi.mock('react-dom', async () => {
    const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node,
    };
});

describe('UserCreateWizard Unit Tests', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        const { queryByText } = render(
            <UserCreateWizard isOpen={false} onClose={mockOnClose} />
        );
        expect(queryByText(/Identity Provisioning/i)).toBeNull();
    });

    it('should render form fields when isOpen is true', async () => {
        render(<UserCreateWizard isOpen={true} onClose={mockOnClose} />);

        await screen.findByText(/Register New/i);
        expect(screen.getAllByText(/Administrator/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /Provision Identity/i })).toBeDefined();
    }, 10000);

    it('should validate required fields and handle successful submission', async () => {
        createUserMock.mockResolvedValueOnce({});

        render(
            <UserCreateWizard 
                isOpen={true} 
                onClose={mockOnClose} 
                onSuccess={mockOnSuccess} 
            />
        );

        // Fill form - Use placeholder or other means if getByLabel fails
        fireEvent.change(screen.getByPlaceholderText(/Full Legal Name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Email Address/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), {
            target: { value: 'password123' },
        });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Provision Identity/i }));

        await waitFor(() => {
            expect(apiClient.user.createUser).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                roles: ['USER'],
            });
        });

        // Verification of success flow steps
        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        }, { timeout: 5000 });
    });

    it('should display error message on API failure', async () => {
        const errorMessage = 'Registry Sync Failed';
        createUserMock.mockRejectedValueOnce(new Error(errorMessage));

        render(<UserCreateWizard isOpen={true} onClose={mockOnClose} />);

        fireEvent.change(screen.getByLabelText(/Legal Identity Name/i), {
            target: { value: 'Fail User' },
        });
        fireEvent.change(screen.getByLabelText(/Communication Node/i), {
            target: { value: 'fail@example.com' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Provision Identity/i }));

        await waitFor(() => {
            expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeDefined();
        });
    });

    it('should lock body scroll when open and unlock on close', () => {
        const { unmount } = render(<UserCreateWizard isOpen={true} onClose={mockOnClose} />);
        expect(document.body.style.overflow).toBe('hidden');

        unmount();
        expect(document.body.style.overflow).toBe('unset');
    });
});
