import FlashcardSession from '../models/FlashcardSession.js';
import Note from '../models/Note.js';

export const startSession = async (req, res) => {
  try {
    const { noteId } = req.body;
    const note = await Note.findById(noteId).select('_id');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const session = await FlashcardSession.create({
      user: req.user._id,
      note: note._id,
      totalCards: 0,
      correctCount: 0,
      accuracy: 0,
      startedAt: new Date(),
      finishedAt: new Date(),
      answers: []
    });
    res.status(201).json({ sessionId: session._id });
  } catch (err) {
    console.error('startSession error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers, totalCards, correctCount: providedCorrect } = req.body; // answers: [{question, givenAnswer, correctAnswer}]
    let correctCount = 0;
    let enriched = [];
    if (Array.isArray(answers) && answers.length > 0) {
      enriched = answers.map(a => ({ ...a, isCorrect: String(a.givenAnswer).trim().toLowerCase() === String(a.correctAnswer).trim().toLowerCase() }));
      correctCount = enriched.filter(a => a.isCorrect).length;
    } else if (typeof providedCorrect === 'number') {
      correctCount = providedCorrect;
    }
    const total = totalCards || (answers?.length ?? 0);
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const session = await FlashcardSession.findByIdAndUpdate(
      sessionId,
      {
        totalCards: total,
        correctCount,
        accuracy,
        answers: enriched,
        finishedAt: new Date()
      },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error('completeSession error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const userStats = async (req, res) => {
  try {
    const agg = await FlashcardSession.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, sessions: { $sum: 1 }, avgAccuracy: { $avg: '$accuracy' } } }
    ]);
    res.json(agg[0] || { sessions: 0, avgAccuracy: 0 });
  } catch (err) {
    console.error('userStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


