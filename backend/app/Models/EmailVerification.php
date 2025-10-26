<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmailVerification extends Model
{
    protected $fillable = [
        'user_id',
        'new_email',
        'token',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Relationship: Email verification belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a new verification token
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Hash the token before storing
     */
    public static function hashToken(string $token): string
    {
        return Hash::make($token);
    }

    /**
     * Verify if token matches
     */
    public function verifyToken(string $token): bool
    {
        return Hash::check($token, $this->token);
    }

    /**
     * Check if token has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if token is valid (not expired)
     */
    public function isValid(): bool
    {
        return !$this->isExpired();
    }

    /**
     * Create a new email verification record
     */
    public static function createVerification(int $userId, string $newEmail): array
    {
        // Delete any existing verifications for this user
        self::where('user_id', $userId)->delete();

        // Generate plain token to send to user
        $plainToken = self::generateToken();

        // Create verification record with hashed token
        $verification = self::create([
            'user_id' => $userId,
            'new_email' => $newEmail,
            'token' => self::hashToken($plainToken),
            'expires_at' => now()->addMinutes(30),
        ]);

        return [
            'verification' => $verification,
            'plain_token' => $plainToken, // Return plain token to send via email
        ];
    }

    /**
     * Clean up expired verifications
     */
    public static function cleanupExpired(): int
    {
        return self::where('expires_at', '<', now())->delete();
    }
}