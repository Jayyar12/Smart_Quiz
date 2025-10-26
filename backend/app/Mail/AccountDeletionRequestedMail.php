<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\AccountDeletion;

class AccountDeletionRequestedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $deletion;

    public function __construct(AccountDeletion $deletion)
    {
        $this->deletion = $deletion;
    }

    public function build()
    {
        return $this->subject('Account Deletion Requested')
                    ->view('emails.account-deletion-requested')
                    ->with([
                        'scheduledDeletionAt' => $this->deletion->scheduled_deletion_at,
                        'daysRemaining' => $this->deletion->daysRemaining(),
                    ]);
    }
}