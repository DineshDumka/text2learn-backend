import { useState, useEffect } from "react";
import * as lessonsApi from "../../api/lessons.api";
import * as progressApi from "../../api/progress.api";
import Loader from "../../components/Loader/Loader";
import "./QuizView.css";

export default function QuizView({ lessonId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await lessonsApi.getLessonQuiz(lessonId);
        setQuiz(data.data.quiz);
      } catch (err) {
        setError(
          err.response?.data?.error?.message || "No quiz found for this lesson",
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [lessonId]);

  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Format: [{questionId, answer}]
    const formatted = quiz.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] || "",
    }));

    setSubmitting(true);
    try {
      const { data } = await progressApi.submitQuiz(quiz.id, formatted);
      setResult(data.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      if (msg?.includes("already passed")) {
        setResult({ score: 100, passed: true, alreadyPassed: true });
      } else {
        setError(msg || "Failed to submit quiz");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading quiz…" />;
  if (error)
    return (
      <div className="quiz-empty">
        <p>{error}</p>
      </div>
    );

  const allAnswered =
    quiz && quiz.questions.every((q) => answers[q.id] !== undefined);
  const passed = result?.score >= 80;

  return (
    <div className="quiz-view card">
      <h2 className="quiz-title">📝 Quiz</h2>

      {/* Result banner */}
      {result && (
        <div className={`quiz-result ${passed ? "quiz-result--pass" : "quiz-result--fail"}`}>
          <div className="quiz-score">{result.score}%</div>
          <div className="quiz-verdict">
            {result.alreadyPassed
              ? "You've already passed this quiz! ✅"
              : passed
                ? "Congratulations! You passed! 🎉"
                : "Keep studying and try again 💪"}
          </div>
        </div>
      )}

      {/* Questions */}
      {!result && (
        <>
          <div className="quiz-questions">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="quiz-question">
                <p className="quiz-q-text">
                  <span className="quiz-q-num">{idx + 1}.</span> {q.text}
                </p>
                <div className="quiz-options">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={`quiz-option ${answers[q.id] === opt ? "quiz-option--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleSelect(q.id, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className="btn btn--primary"
            disabled={!allAnswered || submitting}
          >
            {submitting ? "Submitting…" : "Submit Answers"}
          </button>
        </>
      )}
    </div>
  );
}
