<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailChangedConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function build()
    {
        return $this->subject('Email Change Confirmed')
                    ->view('emails.email-changed-confirmation');
    }
}