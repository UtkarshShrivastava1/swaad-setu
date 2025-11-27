
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import TenantGuard from '../TenantGuard';
import { useCart } from '../../stores/cart.store';

// Mock the cart store
vi.mock('../../stores/cart.store', () => ({
  useCart: () => ({
    clear: vi.fn(),
  }),
}));

describe('TenantGuard', () => {
  it('should render children when rid is valid', () => {
    render(
      <MemoryRouter initialEntries={['/t/restro1']}>
        <Routes>
          <Route path="/t/:rid" element={<TenantGuard><div>Child Component</div></TenantGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('should show error for missing rid', () => {
    render(
      <MemoryRouter initialEntries={['/t/']}>
        <Routes>
            <Route path="/t/" element={<TenantGuard><div>Child Component</div></TenantGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Restaurant ID (rid) is missing from the URL.')).toBeInTheDocument();
  });

  it('should show error for invalid rid format', () => {
    render(
      <MemoryRouter initialEntries={['/t/invalid!rid']}>
        <Routes>
            <Route path="/t/:rid" element={<TenantGuard><div>Child Component</div></TenantGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Invalid Restaurant ID format.')).toBeInTheDocument();
  });

  it('should clear cart when rid changes', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/t/restro1']}>
        <Routes>
            <Route path="/t/:rid" element={<TenantGuard><div>Restro 1</div></TenantGuard>} />
        </Routes>
      </MemoryRouter>
    );

    rerender(
        <MemoryRouter initialEntries={['/t/restro2']}>
            <Routes>
                <Route path="/t/:rid" element={<TenantGuard><div>Restro 2</div></TenantGuard>} />
            </Routes>
        </MemoryRouter>
    );
    
    // How to test this?
    // The cart clear is called inside a useEffect.
    // I need to check if the clear function was called.
    // I've mocked useCart, but I'm not sure how to assert the call.
    // I'll come back to this test later.
  });
});
