<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordChangedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function build()
    {
        return $this->subject('Password Changed Successfully')
                    ->view('emails.password-changed-notification');
    }
}