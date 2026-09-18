-- Parkkar Phase 6: QR verification
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS entry_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS exit_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_entry_verified_at
    ON bookings (entry_verified_at)
    WHERE entry_verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_exit_verified_at
    ON bookings (exit_verified_at)
    WHERE exit_verified_at IS NOT NULL;
