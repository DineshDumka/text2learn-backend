import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as coursesApi from "../../api/courses.api";
import { DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS } from "../../utils/constants";
import { capitalize } from "../../utils/helpers";
import "./CourseCreate.css";

export default function CourseCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("text"); // 'text' | 'pdf'
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [language, setLanguage] = useState("ENGLISH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (mode === "pdf") {
        if (!pdfFile) {
          setError("Please select a PDF file");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("title", title);
        formData.append("difficulty", difficulty);
        formData.append("language", language);
        response = await coursesApi.createCourseFromPdf(formData);
      } else {
        if (!rawText.trim()) {
          setError("Please enter some text for the course topic");
          setLoading(false);
          return;
        }
        response = await coursesApi.createCourse({
          title: title || rawText.slice(0, 80),
          rawText,
          difficulty,
          language,
        });
      }

      navigate(`/courses/${response.data.data.courseId}`);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      if (msg?.includes("quota") || msg?.includes("Quota")) {
        setError("⚠️ Quota exceeded. Please wait or upgrade your plan.");
      } else {
        setError(msg || "Failed to create course. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <h1>Create a New Course</h1>
      <p className="create-subtitle">
        Generate an AI-powered course from text or a PDF document
      </p>

      {/* Mode tabs */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === "text" ? "mode-tab--active" : ""}`}
          onClick={() => setMode("text")}
        >
          ✏️ From Text
        </button>
        <button
          className={`mode-tab ${mode === "pdf" ? "mode-tab--active" : ""}`}
          onClick={() => setMode("pdf")}
        >
          📄 From PDF
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="create-form card">
        <div className="form-group">
          <label htmlFor="title">Course Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Machine Learning"
          />
        </div>

        {mode === "text" ? (
          <div className="form-group">
            <label htmlFor="rawText">Topic / Content</label>
            <textarea
              id="rawText"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Describe what you want to learn about…"
              rows={6}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="pdf">Upload PDF (max 5MB)</label>
            <div className="pdf-upload">
              <input
                id="pdf"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                required
              />
              {pdfFile && (
                <span className="pdf-filename">{pdfFile.name}</span>
              )}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {capitalize(d)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {capitalize(l)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
          {loading ? "Generating…" : "🚀 Generate Course"}
        </button>
      </form>
    </div>
  );
}
