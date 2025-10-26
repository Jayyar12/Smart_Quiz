<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // User must be authenticated (handled by auth middleware)
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[\pL\s\-\']+$/u', // Only letters, spaces, hyphens, and apostrophes
            ],
        ];
    }

    /**
     * Get custom error messages for validation.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Name is required.',
            'name.min' => 'Name must be at least 2 characters.',
            'name.max' => 'Name cannot exceed 50 characters.',
            'name.regex' => 'Name can only contain letters, spaces, hyphens, and apostrophes.',
        ];
    }

    /**
     * Sanitize the input data before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => strip_tags(trim($this->name)),
        ]);
    }
}