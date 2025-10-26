<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountDeletionCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function build()
    {
        return $this->subject('Account Deletion Cancelled')
                    ->view('emails.account-deletion-cancelled');
    }
}