<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'password' => [
                'required',
                'string',
                'current_password',
            ],
            'confirmation' => [
                'required',
                'boolean',
                'accepted', // Must be true
            ],
        ];
    }

    /**
     * Get custom error messages for validation.
     */
    public function messages(): array
    {
        return [
            'password.required' => 'Password is required to delete your account.',
            'password.current_password' => 'The provided password is incorrect.',
            'confirmation.required' => 'You must confirm account deletion.',
            'confirmation.accepted' => 'You must confirm that you want to delete your account.',
        ];
    }
}