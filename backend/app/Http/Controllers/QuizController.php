<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Choice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Models\QuizAttempt;
use App\Models\Answer;

class QuizController extends Controller
{
    /**
    * Get all participants for a quiz
    */
public function getQuizParticipants(Request $request, $quizId)
{
    try {
        $quiz = Quiz::with(['questions'])->findOrFail($quizId);
        
        // Check if user owns this quiz
        if ($quiz->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized to view participants'
            ], 403);
        }
        
        // Calculate total points from questions
        $totalPoints = $quiz->questions->sum('points');
        
        $attempts = QuizAttempt::where('quiz_id', $quizId)
        ->where('completed', true) // Only completed attempts
        ->with(['user', 'answers'])
        ->get();
        
        // If no attempts, return empty array
        if ($attempts->isEmpty()) {
            return response()->json([
                'data' => [
                    'quiz' => [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                        'total_points' => $totalPoints,
                        'question_count' => $quiz->questions->count(),
                    ],
                    'participants' => [],
                ]
            ]);
        }
        
        // Map participants
        $participants = $attempts->map(function ($attempt) use ($totalPoints) {
            $percentage = $totalPoints > 0 
                ? round(($attempt->score / $totalPoints) * 100, 2)
                : 0;
            
            return [
                'id' => $attempt->id,
                'user_id' => $attempt->user_id,
                'user_name' => $attempt->user->name ?? 'Unknown',
                'user_email' => $attempt->user->email ?? 'N/A',
                'score' => $attempt->score ?? 0,
                'percentage' => $percentage,
                'completed' => $attempt->completed,
                'started_at' => $attempt->started_at,
                'completed_at' => $attempt->completed_at,
                'answers_count' => $attempt->answers->count(),
            ];
        })
        ->sortByDesc('score')
        ->values();
        
        return response()->json([
            'data' => [
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'total_points' => $totalPoints,
                    'question_count' => $quiz->questions->count(),
                ],
                'participants' => $participants,
            ]
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error fetching participants: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'message' => 'Failed to fetch participants',
            'error' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null
        ], 500);
    }
}

/**
* Get detailed statistics for a quiz
*/
public function getQuizStatistics(Request $request, $quizId)
{
    $quiz = Quiz::with(['questions'])->findOrFail($quizId);
    
    // Check if user owns this quiz
    if ($quiz->user_id !== $request->user()->id) {
        return response()->json([
            'message' => 'Unauthorized to view statistics'
        ], 403);
    }
    
    $attempts = QuizAttempt::where('quiz_id', $quizId)
        ->where('completed', true)
        ->get();
    
    $totalAttempts = $attempts->count();
    
    if ($totalAttempts === 0) {
        return response()->json([
            'data' => [
                'total_attempts' => 0,
                'average_score' => 0,
                'highest_score' => 0,
                'lowest_score' => 0,
                'pass_rate' => 0,
                'score_distribution' => [],
            ]
        ]);
    }
    
    $scores = $attempts->pluck('score');
    $averageScore = $scores->average();
    $highestScore = $scores->max();
    $lowestScore = $scores->min();
    
    // Calculate pass rate (assuming 60% is passing)
    $passingScore = $quiz->total_points * 0.6;
    $passedCount = $attempts->where('score', '>=', $passingScore)->count();
    $passRate = round(($passedCount / $totalAttempts) * 100, 2);
    
    // Score distribution
    $distribution = [
        '90-100%' => $attempts->filter(fn($a) => ($a->score / $quiz->total_points) >= 0.9)->count(),
        '80-89%' => $attempts->filter(fn($a) => ($a->score / $quiz->total_points) >= 0.8 && ($a->score / $quiz->total_points) < 0.9)->count(),
        '70-79%' => $attempts->filter(fn($a) => ($a->score / $quiz->total_points) >= 0.7 && ($a->score / $quiz->total_points) < 0.8)->count(),
        '60-69%' => $attempts->filter(fn($a) => ($a->score / $quiz->total_points) >= 0.6 && ($a->score / $quiz->total_points) < 0.7)->count(),
        'Below 60%' => $attempts->filter(fn($a) => ($a->score / $quiz->total_points) < 0.6)->count(),
    ];
    
    // Question analysis
    $questionStats = [];
    foreach ($quiz->questions as $question) {
        $answers = Answer::where('question_id', $question->id)
            ->whereHas('attempt', function ($query) use ($quizId) {
                $query->where('quiz_id', $quizId)->where('completed', true);
            })
            ->get();
        
        $totalAnswers = $answers->count();
        $correctAnswers = $answers->where('is_correct', true)->count();
        $correctRate = $totalAnswers > 0 ? round(($correctAnswers / $totalAnswers) * 100, 2) : 0;
        
        $questionStats[] = [
            'question_id' => $question->id,
            'question_text' => $question->question_text,
            'type' => $question->type,
            'points' => $question->points,
            'total_attempts' => $totalAnswers,
            'correct_count' => $correctAnswers,
            'correct_rate' => $correctRate,
            'difficulty' => $correctRate >= 80 ? 'Easy' : ($correctRate >= 50 ? 'Medium' : 'Hard'),
        ];
    }
    
    return response()->json([
        'data' => [
            'total_attempts' => $totalAttempts,
            'completed_attempts' => $totalAttempts,
            'in_progress' => QuizAttempt::where('quiz_id', $quizId)->where('completed', false)->count(),
            'average_score' => round($averageScore, 2),
            'highest_score' => $highestScore,
            'lowest_score' => $lowestScore,
            'pass_rate' => $passRate,
            'score_distribution' => $distribution,
            'question_stats' => $questionStats,
        ]
    ]);
}

    public function saveProgress(Request $request, $attemptId)
    {
        $attempt = QuizAttempt::findOrFail($attemptId);
        
        // Validate user owns this attempt
        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Don't allow saving if already completed
        if ($attempt->completed) {
            return response()->json(['message' => 'Quiz already completed'], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer' => 'nullable|string',
            'answers.*.choice_id' => 'nullable|exists:choices,id',
            'time_remaining' => 'nullable|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Update or create answers - ONLY for non-empty answers
            foreach ($request->answers as $answerData) {
                // Skip if answer is empty (for text-based questions)
                if (!isset($answerData['choice_id']) && 
                    (!isset($answerData['answer']) || trim($answerData['answer']) === '')) {
                    // Delete existing answer if it exists (user cleared the field)
                    Answer::where('quiz_attempt_id', $attemptId)
                        ->where('question_id', $answerData['question_id'])
                        ->delete();
                    continue;
                }
                
                Answer::updateOrCreate(
                    [
                        'quiz_attempt_id' => $attemptId,
                        'question_id' => $answerData['question_id']
                    ],
                    [
                        'choice_id' => $answerData['choice_id'] ?? null,
                        'answer_text' => $answerData['answer'] ?? null,
                    ]
                );
            }
            
            // Update time remaining if provided
            if ($request->has('time_remaining')) {
                $attempt->time_remaining = $request->time_remaining;
                $attempt->save();
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Progress saved',
                'data' => [
                    'saved_at' => now(),
                    'answers_count' => count($request->answers),
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Save progress failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to save progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get saved progress for an attempt (NEW METHOD)
     */
    public function getAttemptProgress(Request $request, $attemptId)
    {
        $attempt = QuizAttempt::with(['answers'])
            ->findOrFail($attemptId);
        
        // Validate user owns this attempt
        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Don't allow loading progress if already completed
        if ($attempt->completed) {
            return response()->json(['message' => 'Quiz already completed'], 422);
        }
        
        return response()->json([
            'data' => [
                'attempt_id' => $attempt->id,
                'time_remaining' => $attempt->time_remaining,
                'answers' => $attempt->answers->map(function ($answer) {
                    return [
                        'question_id' => $answer->question_id,
                        'answer_text' => $answer->answer_text,
                        'choice_id' => $answer->choice_id,
                    ];
                }),
            ]
        ]);
    }

    /**
 * Join quiz by code
 */
public function joinByCode(Request $request)
{
    $validator = Validator::make($request->all(), [
        'code' => 'required|string|size:6'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Invalid code format',
            'errors' => $validator->errors()
        ], 422);
    }

    $quiz = Quiz::with(['questions', 'user'])
        ->where('code', strtoupper($request->code))
        ->published()
        ->first();

    if (!$quiz) {
        return response()->json([
            'message' => 'Quiz not found or not available'
        ], 404);
    }

    return response()->json([
        'message' => 'Quiz found',
        'data' => [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'time_limit' => $quiz->time_limit,
            'question_count' => $quiz->questions->count(),
            'total_points' => $quiz->total_points,
            'creator' => $quiz->user->name,
        ]
    ]);
}

/**
 * Start a quiz attempt
 */
public function startQuiz(Request $request, $id)
    {
        $quiz = Quiz::with(['questions.choices'])
            ->published()
            ->findOrFail($id);

        // Check if user owns the quiz (can't take own quiz)
        if ($quiz->user_id === $request->user()->id) {
            return response()->json(['message' => 'You cannot take your own quiz'], 422);
        }

        // Check if user has already completed this quiz
        $existingCompletedAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $request->user()->id)
            ->where('completed', true)
            ->first();

        if ($existingCompletedAttempt) {
            return response()->json([
                'message' => 'You have already completed this quiz',
                'data' => [
                    'can_view_results' => true,
                    'attempt_id' => $existingCompletedAttempt->id,
                ]
            ], 422);
        }

        // Check for existing incomplete attempt (resume)
        $existingAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $request->user()->id)
            ->where('completed', false)
            ->first();

        if ($existingAttempt) {
            // Resume existing attempt
            $attempt = $existingAttempt;
        } else {
            // Create new attempt
            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $request->user()->id,
                'started_at' => now(),
                'completed' => false,
                'time_remaining' => $quiz->time_limit ? ($quiz->time_limit * 60) : null,
            ]);
        }

        // Randomize questions if enabled
        $questions = $quiz->questions;
        if ($quiz->randomize_questions) {
            $questions = $questions->shuffle();
        }

        // Randomize choices if enabled
        if ($quiz->randomize_choices) {
            $questions = $questions->map(function ($question) {
                if ($question->type === 'multiple_choice') {
                    $question->choices = $question->choices->shuffle()->values();
                }
                return $question;
            });
        }

        return response()->json([
            'message' => $existingAttempt ? 'Resuming quiz attempt' : 'Quiz started successfully',
            'data' => [
                'attempt_id' => $attempt->id,
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'time_limit' => $quiz->time_limit,
                    'show_results_immediately' => $quiz->show_results_immediately,
                    'allow_review' => $quiz->allow_review,
                ],
                'questions' => $questions->values(),
                'started_at' => $attempt->started_at,
                'time_remaining' => $attempt->time_remaining, // Add this for resume
            ]
        ]);
    }

/**
 * Submit quiz answers
 */
 public function submitQuiz(Request $request, $attemptId)
    {
        $attempt = QuizAttempt::with(['quiz.questions.choices'])
            ->findOrFail($attemptId);

        // Check if user owns this attempt
        if ($attempt->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Check if already completed
        if ($attempt->completed) {
            return response()->json([
                'message' => 'Quiz already submitted'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer' => 'nullable|string',
            'answers.*.choice_id' => 'nullable|exists:choices,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $score = 0;
            $totalQuestions = $attempt->quiz->questions->count();

            // Process each answer
            foreach ($request->answers as $answerData) {
                $question = Question::with('choices')->find($answerData['question_id']);
                
                if (!$question || $question->quiz_id !== $attempt->quiz_id) {
                    continue;
                }

                $isCorrect = false;
                $pointsEarned = 0;

                // Check answer based on question type
                if ($question->type === 'multiple_choice' && isset($answerData['choice_id'])) {
                    $choice = Choice::find($answerData['choice_id']);
                    if ($choice && $choice->is_correct) {
                        $isCorrect = true;
                        $pointsEarned = $question->points;
                        $score += $pointsEarned;
                    }

                    // Update or create answer
                    Answer::updateOrCreate(
                        [
                            'quiz_attempt_id' => $attempt->id,
                            'question_id' => $question->id,
                        ],
                        [
                            'choice_id' => $answerData['choice_id'],
                            'is_correct' => $isCorrect,
                            'points_earned' => $pointsEarned,
                        ]
                    );

                } elseif ($question->type === 'identification' && isset($answerData['answer'])) {
                    $userAnswer = trim(strtolower($answerData['answer']));
                    $correctAnswer = trim(strtolower($question->correct_answer));

                    if ($userAnswer === $correctAnswer) {
                        $isCorrect = true;
                        $pointsEarned = $question->points;
                        $score += $pointsEarned;
                    }

                    // Update or create answer
                    Answer::updateOrCreate(
                        [
                            'quiz_attempt_id' => $attempt->id,
                            'question_id' => $question->id,
                        ],
                        [
                            'answer_text' => $answerData['answer'],
                            'is_correct' => $isCorrect,
                            'points_earned' => $pointsEarned,
                        ]
                    );

                } elseif ($question->type === 'essay' && isset($answerData['answer'])) {
                    // Update or create essay answer (requires manual grading)
                    Answer::updateOrCreate(
                        [
                            'quiz_attempt_id' => $attempt->id,
                            'question_id' => $question->id,
                        ],
                        [
                            'answer_text' => $answerData['answer'],
                            'is_correct' => null, // Will be graded manually
                            'points_earned' => 0, // Will be updated after grading
                        ]
                    );
                }
            }

            // Update attempt
            $attempt->update([
                'score' => $score,
                'completed' => true,
                'completed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Quiz submitted successfully',
                'data' => [
                    'attempt_id' => $attempt->id,
                    'score' => $score,
                    'total_points' => $attempt->quiz->total_points,
                    'show_results_immediately' => $attempt->quiz->show_results_immediately,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Submit quiz failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to submit quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

/**
 * Get quiz results
 * Accessible by: attempt owner OR quiz creator
 */
public function getResults(Request $request, $attemptId)
{
    $attempt = QuizAttempt::with([
        'quiz',
        'answers.question.choices',
        'answers.choice',
        'user'
    ])->findOrFail($attemptId);

    // Authorization: Allow if user owns the attempt OR owns the quiz
    $isAttemptOwner = $attempt->user_id === $request->user()->id;
    $isQuizCreator = $attempt->quiz->user_id === $request->user()->id;

    if (!$isAttemptOwner && !$isQuizCreator) {
        return response()->json([
            'message' => 'Unauthorized to view these results'
        ], 403);
    }

    // Check if completed
    if (!$attempt->completed) {
        return response()->json([
            'message' => 'Quiz not yet completed'
        ], 422);
    }

    // ✅ FIX: Creators can ALWAYS see full details
    // Students can only see details if show_results_immediately is enabled
    $canSeeDetails = $isQuizCreator || $attempt->quiz->show_results_immediately;

    if (!$canSeeDetails) {
        return response()->json([
            'message' => 'Results not available yet',
            'data' => [
                'score' => $attempt->score,
                'total_points' => $attempt->quiz->total_points,
                'show_details' => false,
            ]
        ]);
    }

    $responseData = [
        'attempt_id' => $attempt->id,
        'quiz_id' => $attempt->quiz_id,
        'quiz_title' => $attempt->quiz->title,
        'score' => $attempt->score,
        'total_points' => $attempt->quiz->total_points,
        'percentage' => round(($attempt->score / $attempt->quiz->total_points) * 100, 2),
        'completed_at' => $attempt->completed_at,
        'allow_review' => $attempt->quiz->allow_review,
        'show_details' => true, // ✅ Always true when this point is reached
        'is_creator' => $isQuizCreator,
    ];

    // Add participant info if viewing as quiz creator
    if ($isQuizCreator && !$isAttemptOwner) {
        $responseData['participant'] = [
            'id' => $attempt->user->id,
            'name' => $attempt->user->name,
            'email' => $attempt->user->email,
        ];
    }

    // ✅ FIX: Include answers if review is allowed OR if user is the quiz creator
    // This ensures creators can ALWAYS see answers to grade essays
    if ($attempt->quiz->allow_review || $isQuizCreator) {
        $responseData['answers'] = $attempt->answers->map(function ($answer) {
            return [
                'answer_id' => $answer->id,
                'question_id' => $answer->question_id,
                'question_text' => $answer->question->question_text,
                'question_type' => $answer->question->type,
                'user_answer' => $answer->choice_id 
                    ? $answer->choice->choice_text 
                    : $answer->answer_text,
                'correct_answer' => $answer->question->type === 'multiple_choice' 
                    ? $answer->question->choices->where('is_correct', true)->first()?->choice_text
                    : $answer->question->correct_answer,
                'is_correct' => $answer->is_correct,
                'points_earned' => $answer->points_earned ?? 0,
                'points_possible' => $answer->question->points,
                'feedback' => $answer->feedback,
                'choices' => $answer->question->type === 'multiple_choice' 
                    ? $answer->question->choices 
                    : null,
            ];
        });
    }

    return response()->json([
        'data' => $responseData
    ]);
}

    /**
     * Get user's quiz attempts
     */
    public function getMyAttempts(Request $request)
    {
        $attempts = QuizAttempt::with(['quiz.questions'])
            ->where('user_id', $request->user()->id)
            ->where('completed', true)
            ->latest()
            ->paginate($request->get('per_page', 15));

        $attempts->getCollection()->transform(function ($attempt) {
            $totalPoints = $attempt->quiz->questions->sum('points');
            $attempt->quiz->total_points = $totalPoints;
            $attempt->percentage = $totalPoints > 0 ? round(($attempt->score / $totalPoints) * 100, 2) : 0;
            return $attempt;
        });

        return response()->json($attempts);
    }


    
    /**
     * Display a listing of published quizzes.
     */
    public function index(Request $request)
    {
        $query = Quiz::with(['user', 'questions'])
            ->published()
            ->latest();

        // Apply filters if provided
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $quizzes = $query->paginate($request->get('per_page', 15));

        return response()->json($quizzes);
    }

    /**
     * Get quizzes created by the authenticated user.
     */
    public function myQuizzes(Request $request)
    {
        $query = Quiz::with(['questions'])
            ->where('user_id', $request->user()->id)
            ->latest();

        // Add search functionality
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('title', 'like', '%' . $searchTerm . '%')
                ->orWhere('description', 'like', '%' . $searchTerm . '%');
            });
        }

        $quizzes = $query->paginate($request->get('per_page', 15));

        return response()->json($quizzes);
    }

    /**
     * Store a newly created quiz in storage.
     */
    /**
 * Store a newly created quiz in storage.
 */
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'time_limit' => 'nullable|integer|min:1',
        'randomize_questions' => 'boolean',
        'randomize_choices' => 'boolean',
        'show_results_immediately' => 'boolean',
        'allow_review' => 'boolean',
        'questions' => 'required|array|min:1',
        'questions.*.type' => ['required', Rule::in(['multiple_choice', 'identification', 'essay'])],
        'questions.*.question_text' => 'required|string',
        'questions.*.points' => 'required|integer|min:1',
        'questions.*.correct_answer' => 'nullable|string',
        'questions.*.choices' => 'nullable|array|min:2',
        'questions.*.choices.*.choice_text' => 'required_with:questions.*.choices|string',
        'questions.*.choices.*.is_correct' => 'required_with:questions.*.choices|boolean',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    // Add custom validation
    $questions = $request->questions;
    foreach ($questions as $index => $question) {
        if ($question['type'] === 'identification' && empty($question['correct_answer'])) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => [
                    "questions.{$index}.correct_answer" => ["The correct answer is required for identification questions."]
                ]
            ], 422);
        }

        if ($question['type'] === 'multiple_choice') {
            if (!isset($question['choices']) || count($question['choices']) < 2) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        "questions.{$index}.choices" => ["Multiple choice questions must have at least 2 choices."]
                    ]
                ], 422);
            }

            $hasCorrectAnswer = false;
            foreach ($question['choices'] as $choice) {
                if (isset($choice['is_correct']) && $choice['is_correct']) {
                    $hasCorrectAnswer = true;
                    break;
                }
            }

            if (!$hasCorrectAnswer) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        "questions.{$index}.choices" => ["At least one choice must be marked as correct."]
                    ]
                ], 422);
            }
        }
    }

    try {
        DB::beginTransaction();

        // CREATE the quiz (not update!)
        $quiz = Quiz::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'time_limit' => $request->time_limit,
            'randomize_questions' => $request->randomize_questions ?? false,
            'randomize_choices' => $request->randomize_choices ?? false,
            'show_results_immediately' => $request->show_results_immediately ?? true,
            'allow_review' => $request->allow_review ?? true,
        ]);

        // Create questions and choices
        foreach ($request->questions as $index => $questionData) {
            $question = Question::create([
                'quiz_id' => $quiz->id,
                'type' => $questionData['type'],
                'question_text' => $questionData['question_text'],
                'points' => $questionData['points'],
                'correct_answer' => $questionData['correct_answer'] ?? null,
                'order' => $index,
            ]);

            // Create choices for multiple choice questions
            if ($questionData['type'] === 'multiple_choice' && isset($questionData['choices'])) {
                foreach ($questionData['choices'] as $choiceIndex => $choiceData) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_text' => $choiceData['choice_text'],
                        'is_correct' => $choiceData['is_correct'],
                        'order' => $choiceIndex,
                    ]);
                }
            }
        }

        DB::commit();

        // Load relationships for response
        $quiz->load(['questions.choices', 'user']);

        return response()->json([
            'message' => 'Quiz created successfully',
            'data' => $quiz
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        
        return response()->json([
            'message' => 'Failed to create quiz',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Display the specified quiz.
     */
    public function show($id)
    {
        $quiz = Quiz::with(['questions.choices', 'user'])
            ->findOrFail($id);

        // Check if user can view this quiz
        if (!$quiz->is_published && $quiz->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized to view this quiz'
            ], 403);
        }

        return response()->json($quiz);
    }

    /**
     * Update the specified quiz in storage.
     */
    public function update(Request $request, $id)
{
    $quiz = Quiz::findOrFail($id);

    // Check if user owns this quiz
    if ($quiz->user_id !== $request->user()->id) {
        return response()->json([
            'message' => 'Unauthorized to update this quiz'
        ], 403);
    }

    $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'time_limit' => 'nullable|integer|min:1',
        'randomize_questions' => 'boolean',
        'randomize_choices' => 'boolean',
        'show_results_immediately' => 'boolean',
        'allow_review' => 'boolean',
        'questions' => 'required|array|min:1',
        'questions.*.type' => ['required', Rule::in(['multiple_choice', 'identification', 'essay'])],
        'questions.*.question_text' => 'required|string',
        'questions.*.points' => 'required|integer|min:1',
        'questions.*.correct_answer' => 'nullable|string',
        'questions.*.choices' => 'nullable|array|min:2',
        'questions.*.choices.*.choice_text' => 'required_with:questions.*.choices|string',
        'questions.*.choices.*.is_correct' => 'required_with:questions.*.choices|boolean',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    // Add custom validation
    $questions = $request->questions;
    foreach ($questions as $index => $question) {
        if ($question['type'] === 'identification' && empty($question['correct_answer'])) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => [
                    "questions.{$index}.correct_answer" => ["The correct answer is required for identification questions."]
                ]
            ], 422);
        }

        if ($question['type'] === 'multiple_choice') {
            if (!isset($question['choices']) || count($question['choices']) < 2) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        "questions.{$index}.choices" => ["Multiple choice questions must have at least 2 choices."]
                    ]
                ], 422);
            }

            $hasCorrectAnswer = false;
            foreach ($question['choices'] as $choice) {
                if (isset($choice['is_correct']) && $choice['is_correct']) {
                    $hasCorrectAnswer = true;
                    break;
                }
            }

            if (!$hasCorrectAnswer) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        "questions.{$index}.choices" => ["At least one choice must be marked as correct."]
                    ]
                ], 422);
            }
        }
    }

    try {
        DB::beginTransaction();

        // Update the quiz metadata
        $quiz->update([
            'title' => $request->title,
            'description' => $request->description,
            'time_limit' => $request->time_limit,
            'randomize_questions' => $request->randomize_questions ?? false,
            'randomize_choices' => $request->randomize_choices ?? false,
            'show_results_immediately' => $request->show_results_immediately ?? true,
            'allow_review' => $request->allow_review ?? true,
        ]);

        // Delete old questions and choices (cascade will handle choices)
        $quiz->questions()->delete();

        // Create new questions and choices
        foreach ($request->questions as $index => $questionData) {
            $question = Question::create([
                'quiz_id' => $quiz->id,
                'type' => $questionData['type'],
                'question_text' => $questionData['question_text'],
                'points' => $questionData['points'],
                'correct_answer' => $questionData['correct_answer'] ?? null,
                'order' => $index,
            ]);

            // Create choices for multiple choice questions
            if ($questionData['type'] === 'multiple_choice' && isset($questionData['choices'])) {
                foreach ($questionData['choices'] as $choiceIndex => $choiceData) {
                    Choice::create([
                        'question_id' => $question->id,
                        'choice_text' => $choiceData['choice_text'],
                        'is_correct' => $choiceData['is_correct'],
                        'order' => $choiceIndex,
                    ]);
                }
            }
        }

        DB::commit();

        // Load relationships for response
        $quiz->load(['questions.choices', 'user']);

        return response()->json([
            'message' => 'Quiz updated successfully',
            'data' => $quiz
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        
        return response()->json([
            'message' => 'Failed to update quiz',
            'error' => $e->getMessage()
        ], 500);
    }
}
    /**
     * Remove the specified quiz from storage.
     */
    public function destroy(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        // Check if user owns this quiz
        if ($quiz->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized to delete this quiz'
            ], 403);
        }

        try {
            $quiz->delete();

            return response()->json([
                'message' => 'Quiz deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Publish a quiz.
     */
    public function publish(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        // Check if user owns this quiz
        if ($quiz->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized to publish this quiz'
            ], 403);
        }

        // Check if quiz has at least one question
        if ($quiz->questions()->count() === 0) {
            return response()->json([
                'message' => 'Cannot publish quiz without questions'
            ], 422);
        }

        // Generate code if not exists
        if (!$quiz->code) {
            $quiz->code = Quiz::generateUniqueCode();
            $quiz->save();
        }

        $quiz->publish();

        return response()->json([
            'message' => 'Quiz published successfully',
            'data' => $quiz
        ]);
    }

    /**
     * Unpublish a quiz.
     */
    public function unpublish(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        // Check if user owns this quiz
        if ($quiz->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized to unpublish this quiz'
            ], 403);
        }

        $quiz->unpublish();

        return response()->json([
            'message' => 'Quiz unpublished successfully',
            'data' => $quiz
        ]);
    }
}