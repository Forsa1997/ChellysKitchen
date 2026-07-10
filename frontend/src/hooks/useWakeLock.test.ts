import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

const installWakeLockMock = () => {
  const release = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue({ release });
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request },
  });
  return { request, release };
};

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('useWakeLock', () => {
  it('requests a screen wake lock while active', async () => {
    const { request } = installWakeLockMock();

    renderHook(() => useWakeLock(true));

    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
  });

  it('does not request a wake lock while inactive', () => {
    const { request } = installWakeLockMock();

    renderHook(() => useWakeLock(false));

    expect(request).not.toHaveBeenCalled();
  });

  it('releases the wake lock when deactivated', async () => {
    const { request, release } = installWakeLockMock();

    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    rerender({ active: false });

    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
  });

  it('releases the wake lock on unmount', async () => {
    const { request, release } = installWakeLockMock();

    const { unmount } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    unmount();

    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
  });

  it('re-acquires the wake lock when the tab becomes visible again', async () => {
    const { request } = installWakeLockMock();

    renderHook(() => useWakeLock(true));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    // Browsers drop the lock when the tab goes to the background; on return
    // the hook has to request it again (jsdom reports 'visible').
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it('is a no-op when the browser does not support the Wake Lock API', () => {
    Reflect.deleteProperty(navigator, 'wakeLock');

    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
