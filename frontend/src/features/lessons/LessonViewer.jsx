import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import * as lessonsApi from "../../api/lessons.api";
import * as progressApi from "../../api/progress.api";
import { LANGUAGE_OPTIONS } from "../../utils/constants";
import { capitalize } from "../../utils/helpers";
import Loader from "../../components/Loader/Loader";
import QuizView from "./QuizView";
import "./LessonViewer.css";

export default function LessonViewer() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("ENGLISH");
  const [showQuiz, setShowQuiz] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const { data } = await lessonsApi.getLesson(id, lang);
        setLesson(data.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id, lang]);

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await progressApi.markLessonComplete(id);
      setCompleted(true);
    } catch {
      // Silently fail — user can retry
    }
    setCompleting(false);
  };

  if (loading) return <Loader text="Loading lesson…" />;
  if (error)
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>{error}</h3>
      </div>
    );

  // The lesson data from API includes content fields
  const content = lesson?.content || lesson;
  const theory = content?.theory || content?.content || "";
  const codeExample = content?.codeExample || null;
  const youtubeUrl = content?.youtubeUrl || null;
  const title = content?.title || "Untitled Lesson";

  return (
    <div className="lesson-viewer">
      {/* Header */}
      <div className="lv-header">
        <div className="lv-header-left">
          <Link to={`/courses/${lesson?.courseId || ""}`} className="lv-back">
            ← Back to Course
          </Link>
          <h1>{title}</h1>
        </div>

        <div className="lv-controls">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="lang-select"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {capitalize(l)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Theory */}
      <section className="lv-section">
        <h2 className="lv-section-title">📖 Theory</h2>
        <div className="lv-theory">{theory}</div>
      </section>

      {/* Code Example */}
      {codeExample && (
        <section className="lv-section">
          <h2 className="lv-section-title">💻 Code Example</h2>
          <pre className="lv-code">
            <code>{codeExample}</code>
          </pre>
        </section>
      )}

      {/* YouTube Video */}
      {youtubeUrl && !youtubeUrl.startsWith("search:") && (
        <section className="lv-section">
          <h2 className="lv-section-title">🎬 Video</h2>
          <div className="lv-video">
            <iframe
              src={youtubeUrl.replace("watch?v=", "embed/")}
              title="YouTube video"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </section>
      )}

      {/* YouTube search fallback */}
      {youtubeUrl && youtubeUrl.startsWith("search:") && (
        <section className="lv-section">
          <h2 className="lv-section-title">🎬 Suggested Video</h2>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeUrl.replace("search:", ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--secondary"
          >
            🔍 Search on YouTube: {youtubeUrl.replace("search:", "")}
          </a>
        </section>
      )}

      {/* Actions */}
      <div className="lv-actions">
        <button
          onClick={handleMarkComplete}
          className={`btn ${completed ? "btn--secondary" : "btn--primary"}`}
          disabled={completing || completed}
        >
          {completed ? "✅ Completed" : completing ? "Saving…" : "Mark as Complete"}
        </button>
        <button onClick={() => setShowQuiz(!showQuiz)} className="btn btn--secondary">
          {showQuiz ? "Hide Quiz" : "📝 Take Quiz"}
        </button>
      </div>

      {/* Quiz */}
      {showQuiz && <QuizView lessonId={id} />}
    </div>
  );
}
