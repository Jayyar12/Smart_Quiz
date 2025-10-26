<!DOCTYPE html>
<html>
<head>
    <title>Email Verification</title>
</head>
<body>
    <h2>Verify Your Email Address Change</h2>
    <p>You have requested to change your email address. Please use the verification code below:</p>
    
    <div style="background: #f4f4f4; padding: 10px; margin: 15px 0; font-size: 18px; font-weight: bold;">
        Verification Code: {{ $token }}
    </div>
    
    <p>Enter this code in the application to verify your new email address.</p>
    <p><strong>This code will expire in 30 minutes.</strong></p>
    
    <p>If you didn't request this change, please ignore this email and review your account security.</p>
</body>
</html>