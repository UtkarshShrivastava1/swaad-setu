
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TableProvider, useTable } from '../TableContext';

const TestComponent = () => {
  const { tableId, setTableId, clearTable } = useTable();
  return (
    <div>
      <div data-testid="tableId">{tableId}</div>
      <button onClick={() => setTableId('T1')}>Set Table</button>
      <button onClick={() => clearTable()}>Clear Table</button>
    </div>
  );
};

describe('TableContext', () => {
  it('should have null initial tableId', () => {
    render(
      <TableProvider>
        <TestComponent />
      </TableProvider>
    );
    expect(screen.getByTestId('tableId').textContent).toBe('');
  });

  it('should set tableId', () => {
    render(
      <TableProvider>
        <TestComponent />
      </TableProvider>
    );
    act(() => {
      screen.getByText('Set Table').click();
    });
    expect(screen.getByTestId('tableId').textContent).toBe('T1');
  });

  it('should clear tableId', () => {
    render(
      <TableProvider>
        <TestComponent />
      </TableProvider>
    );
    act(() => {
      screen.getByText('Set Table').click();
    });
    act(() => {
      screen.getByText('Clear Table').click();
    });
    expect(screen.getByTestId('tableId').textContent).toBe('');
  });
});
