<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats($id)
{
    if (auth()->id() != $id) {
        return response()->json([
            'message' => 'Unauthorized to access these stats'
        ], 403);
    }

    try {
        $totalQuizzes = Quiz::where('user_id', $id)->count();
        $activeQuizzes = Quiz::where('user_id', $id)->where('is_published', true)->count();
        $draftQuizzes = Quiz::where('user_id', $id)->where('is_published', false)->count();

        $totalQuestions = DB::table('questions')
            ->join('quizzes', 'questions.quiz_id', '=', 'quizzes.id')
            ->where('quizzes.user_id', $id)
            ->count();

        $attemptStats = DB::table('quiz_attempts')
            ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.id')
            ->where('quizzes.user_id', $id)
            ->select(
                DB::raw('COUNT(*) as total_attempts'),
                DB::raw('COUNT(DISTINCT quiz_attempts.user_id) as unique_participants'),
                DB::raw('AVG(score) as average_score'),
                DB::raw('MAX(score) as highest_score')
            )
            ->first();

        $totalAttempts = $attemptStats->total_attempts ?? 0;
        $uniqueParticipants = $attemptStats->unique_participants ?? 0;
        $highestScore = $attemptStats->highest_score ?? 0;

        $recentQuizzes = Quiz::where('user_id', $id)
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get(['id', 'title', 'is_published', 'updated_at']);

        $completionRate = 0;
        if ($totalAttempts > 0) {
            $completedAttempts = DB::table('quiz_attempts')
                ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.id')
                ->where('quizzes.user_id', $id)
                ->where('quiz_attempts.completed', true)
                ->count();

            $completionRate = round(($completedAttempts / $totalAttempts) * 100, 2);
        }

        return response()->json([
            'totalQuizzes' => $totalQuizzes,
            'activeQuizzes' => $activeQuizzes,
            'draftQuizzes' => $draftQuizzes,
            'totalQuestions' => $totalQuestions,
            'totalAttempts' => $totalAttempts,
            'uniqueParticipants' => $uniqueParticipants,
            'highestScore' => $highestScore,
            'completionRate' => $completionRate,
            'recentQuizzes' => $recentQuizzes,
            'success' => true
        ]);

    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Failed to fetch dashboard statistics',
            'error' => $e->getMessage(),
            'success' => false
        ], 500);
    }
}
}