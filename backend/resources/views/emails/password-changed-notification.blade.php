<!DOCTYPE html>
<html>
<head>
    <title>Password Changed</title>
</head>
<body>
    <h2>Password Successfully Updated</h2>
    <p>Your account password has been changed successfully.</p>
    
    <p><strong>Date:</strong> {{ now()->format('F j, Y \a\t g:i A') }}</p>
    
    <p>If you made this change, no further action is required.</p>
    
    <p><strong>If you did not change your password, please reset your password immediately and contact our support team.</strong></p>
</body>
</html>