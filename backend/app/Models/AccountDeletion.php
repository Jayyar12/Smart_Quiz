<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountDeletion extends Model
{
    protected $fillable = [
        'user_id',
        'requested_at',
        'scheduled_deletion_at',
        'status',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'scheduled_deletion_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_PENDING = 'pending';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_COMPLETED = 'completed';

    /**
     * Grace period in days
     */
    const GRACE_PERIOD_DAYS = 30;

    /**
     * Relationship: Deletion request belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if deletion request is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if deletion request is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Check if deletion is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if scheduled deletion date has passed
     */
    public function isDue(): bool
    {
        return $this->scheduled_deletion_at->isPast() && $this->isPending();
    }

    /**
     * Create a new deletion request
     */
    public static function requestDeletion(int $userId): self
    {
        // Cancel any existing pending deletion requests
        self::where('user_id', $userId)
            ->where('status', self::STATUS_PENDING)
            ->update(['status' => self::STATUS_CANCELLED]);

        // Create new deletion request
        return self::create([
            'user_id' => $userId,
            'requested_at' => now(),
            'scheduled_deletion_at' => now()->addDays(self::GRACE_PERIOD_DAYS),
            'status' => self::STATUS_PENDING,
        ]);
    }

    /**
     * Cancel the deletion request
     */
    public function cancel(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;
        return $this->save();
    }

    /**
     * Mark deletion as completed
     */
    public function markCompleted(): bool
    {
        $this->status = self::STATUS_COMPLETED;
        return $this->save();
    }

    /**
     * Get all pending deletions that are due
     */
    public static function getDueDeletions()
    {
        return self::where('status', self::STATUS_PENDING)
            ->where('scheduled_deletion_at', '<=', now())
            ->with('user')
            ->get();
    }

    /**
     * Get days remaining until deletion
     */
    public function daysRemaining(): int
    {
        if (!$this->isPending()) {
            return 0;
        }

        return max(0, now()->diffInDays($this->scheduled_deletion_at, false));
    }
}