import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Note from '../models/Note.js';

// List public quizzes and quizzes assigned to the logged-in student
export const listAvailableQuizzes = async (req, res) => {
  try {
    const userId = req.user?._id;
    // Show all public quizzes and all quizzes created by any teacher
    const quizzes = await Quiz.find({
      $or: [
        { isPublic: true },
        { assignedTo: userId },
        { createdByTeacher: { $exists: true, $ne: null } }
      ]
    }).select('_id title description createdByTeacher isPublic').sort({ createdAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    console.error('List quizzes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Create a quiz (teacher)
export const createQuiz = async (req, res) => {
  try {
    const { title, description, noteId, questions, isPublic } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question are required' });
    }

    const quiz = await Quiz.create({
      title,
      description,
      note: noteId || null,
      createdByTeacher: req.teacher?._id || req.user?._id, // prefer teacher if available
      isPublic: Boolean(isPublic),
      questions
    });

    res.status(201).json(quiz);
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate quiz from a note's flashcards (randomized)
export const generateQuizFromNote = async (req, res) => {
  try {
    console.log('Generating quiz, request body:', req.body);
    const { noteId, numQuestions = 10 } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format'
      });
    }

    const note = await Note.findById(noteId);
    console.log('Found note:', note ? 'yes' : 'no');
    
    // Validate note exists and has flashcards
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    if (!note.flashcards || !Array.isArray(note.flashcards) || note.flashcards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No flashcards found for this note'
      });
    }

    console.log(`Found ${note.flashcards.length} flashcards`);

    // Generate questions with proper structure and validation
    const shuffled = [...note.flashcards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(0, Math.min(Number(numQuestions), shuffled.length));
    
    const questions = selectedCards.map(card => {
      // Ensure we have valid data
      if (!card || typeof card.question !== 'string' || typeof card.answer !== 'string') {
        console.warn('Invalid card data:', card);
        return null;
      }

      // Generate multiple choice options if possible
      let options = [];
      if (Array.isArray(card.options) && card.options.length > 0) {
        options = card.options;
      } else {
        // Try to generate options from other flashcards
        const otherAnswers = note.flashcards
          .filter(f => f._id.toString() !== card._id.toString() && f.answer)
          .map(f => f.answer)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
          
        if (otherAnswers.length > 0) {
          options = [...otherAnswers, card.answer].sort(() => Math.random() - 0.5);
        }
      }

      return {
        question: card.question.trim(),
        options: options.map(opt => opt.trim()),
        correctAnswer: card.answer.trim(),
        explanation: card.explanation ? card.explanation.trim() : '',
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
        tags: Array.isArray(card.tags) ? card.tags : []
      };
    }).filter(q => q !== null);

    // Create the quiz with proper validation
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions could be generated'
      });
    }

    console.log(`Generated ${questions.length} valid questions`);

    // Create quiz data with conditional createdByTeacher
    const quizData = {
      title: `${note.title} - Quick Quiz`,
      description: `Auto-generated quiz from ${note.title} flashcards`,
      note: note._id,
      isPublic: true,
      questions: questions.map(q => ({
        ...q,
        _id: new mongoose.Types.ObjectId()
      }))
    };

    // Only set createdByTeacher if it's a teacher creating the quiz
    if (req.teacher) {
      quizData.createdByTeacher = req.teacher._id;
    }

    console.log('Creating quiz with data:', {
      title: quizData.title,
      questionCount: quizData.questions.length,
      noteId: quizData.note
    });

    const quiz = await Quiz.create(quizData);

    // Format the response to match what the client expects
    const response = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }))
    };

    console.log('Quiz created successfully');

    res.status(201).json(response);

  } catch (err) {
    console.error('Generate quiz error:', {
      error: err,
      noteId: req.body.noteId,
      userId: req.user?._id,
      teacherId: req.teacher?._id
    });
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate quiz: ' + (err.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? {
        error: err.message,
        stack: err.stack
      } : undefined
    });
  }
};

// Get quiz (student/teacher)
export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('note', 'title subject');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit attempt (student)
export const submitAttempt = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers must be an array' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let correctCount = 0;
    const evaluated = answers.map(ans => {
      const q = quiz.questions.id(ans.questionId);
      if (!q) {
        return {
          questionId: ans.questionId,
          givenAnswer: ans.givenAnswer || '',
          isCorrect: false,
          correctAnswer: '',
          explanation: '',
          question: '',
          errorMessage: 'Question not found'
        };
      }

      // Enhanced MCQ evaluation - exact match for options with null safety
      let isCorrect = false;
      const givenAnswer = String(ans.givenAnswer || '').trim();
      const correctAnswer = String(q.correctAnswer || '').trim();
      
      if (givenAnswer && correctAnswer) {
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          // For MCQ, do exact match
          isCorrect = givenAnswer === correctAnswer;
        } else {
          // For text answers, do case-insensitive comparison
          isCorrect = givenAnswer.toLowerCase() === correctAnswer.toLowerCase();
        }
      }
      
      if (isCorrect) correctCount += 1;

      return {
        questionId: ans.questionId,
        givenAnswer: givenAnswer,
        isCorrect,
        correctAnswer: correctAnswer,
        explanation: q.explanation || '',
        question: q.question || ''
      };
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      score,
      totalQuestions: quiz.questions.length,
      correctCount,
      answers: evaluated,
      startedAt: new Date(),
      finishedAt: new Date()
    });

    res.status(201).json({
      success: true,
      attempt: {
        id: attempt._id,
        score,
        correctCount,
        totalQuestions: quiz.questions.length,
        answers: evaluated,
        feedback: score >= 70 ? 'Great job!' : 'Keep practicing!'
      }
    });

  } catch (err) {
    console.error('Submit attempt error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit attempt',
      error: err.message 
    });
  }
};

// Teacher stats dashboard with wrong answer analysis
export const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.teacher?._id;
    const quizzes = await Quiz.find({ createdByTeacher: teacherId }).select('_id title');
    const quizIds = quizzes.map(q => q._id);

    const agg = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds } } },
      { $group: {
          _id: '$quiz',
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    const totals = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds } } },
      { $group: {
          _id: null,
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    // Attempts over time (last 14 days)
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const overTime = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds }, createdAt: { $gte: fourteenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Wrong answer analysis - most commonly missed questions
    const wrongAnswers = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds } } },
      { $unwind: '$answers' },
      { $match: { 'answers.isCorrect': false } },
      { $group: {
          _id: {
            quiz: '$quiz',
            questionId: '$answers.questionId',
            question: '$answers.question'
          },
          wrongCount: { $sum: 1 },
          totalAttempts: { $sum: 1 }
        }
      },
      { $sort: { wrongCount: -1 } },
      { $limit: 10 }
    ]);

    // Add quiz titles to wrong answers
    const wrongAnswersWithTitles = wrongAnswers.map(wa => {
      const quiz = quizzes.find(q => q._id.toString() === wa._id.quiz.toString());
      return {
        ...wa,
        quizTitle: quiz ? quiz.title : 'Unknown Quiz'
      };
    });

    res.json({ 
      perQuiz: agg, 
      totals: totals[0] || { attempts: 0, avgScore: 0 }, 
      overTime,
      wrongAnswers: wrongAnswersWithTitles
    });
  } catch (err) {
    console.error('Teacher stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


