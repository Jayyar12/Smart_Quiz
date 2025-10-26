<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailChangeAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $newEmail;

    public function __construct($newEmail)
    {
        $this->newEmail = $newEmail;
    }

    public function build()
    {
        return $this->subject('Email Change Requested')
                    ->view('emails.email-change-alert')
                    ->with(['newEmail' => $this->newEmail]);
    }
}