<!DOCTYPE html>
<html>
<head>
    <title>Account Deletion Requested</title>
</head>
<body>
    <h2>Account Deletion Scheduled</h2>
    <p>We've received your request to delete your account.</p>
    
    <p><strong>Scheduled deletion date:</strong> {{ $scheduledDeletionAt->format('F j, Y \a\t g:i A') }}</p>
    <p><strong>Days remaining to cancel:</strong> {{ $daysRemaining }} days</p>
    
    <p>Your account and all associated data will be permanently deleted on the scheduled date.</p>
    
    <p>If you change your mind, you can cancel this deletion request from your account settings within the next {{ $daysRemaining }} days.</p>
    
    <p>After the scheduled date, this action cannot be undone.</p>
</body>
</html>