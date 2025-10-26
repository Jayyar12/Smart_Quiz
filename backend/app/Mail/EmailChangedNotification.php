<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailChangedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $newEmail;

    public function __construct($newEmail)
    {
        $this->newEmail = $newEmail;
    }

    public function build()
    {
        return $this->subject('Email Address Changed')
                    ->view('emails.email-changed-notification')
                    ->with(['newEmail' => $this->newEmail]);
    }
}