<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNameRequest;
use App\Http\Requests\RequestEmailChangeRequest;
use App\Http\Requests\VerifyEmailChangeRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\DeleteAccountRequest;
use App\Models\EmailVerification;
use App\Models\AccountDeletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\UserResource;
use App\Mail\EmailVerificationMail;
use App\Mail\EmailChangeAlertMail;
use App\Mail\EmailChangedNotification;
use App\Mail\EmailChangedConfirmation;
use App\Mail\PasswordChangedNotification;
use App\Mail\AccountDeletionRequestedMail;
use App\Mail\AccountDeletionCancelledMail;

class UserSettingsController extends Controller
{
    /**
     * Update user's display name
     */
    public function updateName(UpdateNameRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->name = $request->validated()['name'];
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Name updated successfully.',
                'data' => [
                    'user' => new UserResource($user),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update name. Please try again.',
            ], 500);
        }
    }

    /**
     * Request email change - sends verification token to new email
     */
    public function requestEmailChange(RequestEmailChangeRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $newEmail = $request->validated()['email'];

            // Create verification record and get plain token
            $result = EmailVerification::createVerification($user->id, $newEmail);
            $plainToken = $result['plain_token'];

            // TODO: Send verification email to new email address
            Mail::to($newEmail)->send(new EmailVerificationMail($plainToken));

            // Send security alert to old email
            Mail::to($user->email)->send(new EmailChangeAlertMail($newEmail));

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your new email address.',
                'data' => [
                    'new_email' => $newEmail,
                    'expires_in_minutes' => 30,
                    // ONLY FOR TESTING - REMOVE IN PRODUCTION
                    'token' => $plainToken,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to request email change. Please try again.',
            ], 500);
        }
    }

    /**
     * Verify email change with token
     */
    public function verifyEmailChange(VerifyEmailChangeRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $token = $request->validated()['token'];

            // Find verification record
            $verification = EmailVerification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'No pending email verification found.',
                ], 404);
            }

            // Check if expired
            if ($verification->isExpired()) {
                $verification->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Verification token has expired. Please request a new one.',
                ], 400);
            }

            // Verify token
            if (!$verification->verifyToken($token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification token.',
                ], 400);
            }

            // Update user's email
            $oldEmail = $user->email;
            $user->email = $verification->new_email;
            $user->save();

            // Delete verification record
            $verification->delete();

            Mail::to($oldEmail)->send(new EmailChangedNotification($user->email));
            Mail::to($user->email)->send(new EmailChangedConfirmation());

            return response()->json([
                'success' => true,
                'message' => 'Email address updated successfully.',
                'data' => [
                    'user' => new UserResource($user),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify email. Please try again.',
            ], 500);
        }
    }

    /**
     * Update user's password
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $validated = $request->validated();

            // Update password
            $user->password = Hash::make($validated['password']);
            $user->save();

            // TODO: Send password changed notification email
            Mail::to($user->email)->send(new PasswordChangedNotification());

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password. Please try again.',
            ], 500);
        }
    }

    public function logoutAllDevices(): JsonResponse
    {
        try {
            $user = Auth::user();
            $currentToken = $user->currentAccessToken();

            if ($currentToken) {
                // Delete all tokens except the current one
                $user->tokens()
                    ->where('id', '!=', $currentToken->id)
                    ->delete();
                    
                $message = 'Logged out from all other devices successfully.';
            } else {
                // Fallback: delete all tokens
                $user->tokens()->delete();
                $message = 'Logged out from all devices successfully.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to logout from all devices.',
            ], 500);
        }
    }
    /**
     * Request account deletion (30-day grace period)
     */
    public function requestAccountDeletion(DeleteAccountRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();

            // Create deletion request
            $deletion = AccountDeletion::requestDeletion($user->id);

            // TODO: Send deletion confirmation email
            Mail::to($user->email)->send(new AccountDeletionRequestedMail($deletion));

            return response()->json([
                'success' => true,
                'message' => 'Account deletion requested. You have 30 days to cancel.',
                'data' => [
                    'scheduled_deletion_at' => $deletion->scheduled_deletion_at,
                    'days_remaining' => $deletion->daysRemaining(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to request account deletion.',
            ], 500);
        }
    }

    /**
     * Cancel account deletion request
     */
    public function cancelAccountDeletion(): JsonResponse
    {
        try {
            $user = Auth::user();

            // Find pending deletion request
            $deletion = AccountDeletion::where('user_id', $user->id)
                ->where('status', AccountDeletion::STATUS_PENDING)
                ->first();

            if (!$deletion) {
                return response()->json([
                    'success' => false,
                    'message' => 'No pending deletion request found.',
                ], 404);
            }

            // Cancel deletion
            $deletion->cancel();

            // TODO: Send cancellation confirmation email
            Mail::to($user->email)->send(new AccountDeletionCancelledMail());

            return response()->json([
                'success' => true,
                'message' => 'Account deletion cancelled successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel account deletion.',
            ], 500);
        }
    }

    /**
     * Get deletion status
     */
    public function getDeletionStatus(): JsonResponse
    {
        try {
            $user = Auth::user();

            $deletion = AccountDeletion::where('user_id', $user->id)
                ->where('status', AccountDeletion::STATUS_PENDING)
                ->first();

            if (!$deletion) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'has_pending_deletion' => false,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'has_pending_deletion' => true,
                    'scheduled_deletion_at' => $deletion->scheduled_deletion_at,
                    'days_remaining' => $deletion->daysRemaining(),
                    'requested_at' => $deletion->requested_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get deletion status.',
            ], 500);
        }
    }

    /**
     * Get current user settings/profile
     */
    public function getProfile(): JsonResponse
    {
        try {
            $user = Auth::user();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => new UserResource($user),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile.',
            ], 500);
        }
    }
}