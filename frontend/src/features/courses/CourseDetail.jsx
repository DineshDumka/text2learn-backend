import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as coursesApi from "../../api/courses.api";
import * as exportApi from "../../api/export.api";
import { useCourseStatus } from "../../hooks/useCourseStatus";
import { downloadBlob, capitalize } from "../../utils/helpers";
import { COURSE_STATUS } from "../../utils/constants";
import Loader from "../../components/Loader/Loader";
import "./CourseDetail.css";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Poll status if generating
  const { status: polledStatus } = useCourseStatus(
    course?.status === COURSE_STATUS.GENERATING ? id : null,
  );

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await coursesApi.getCourse(id);
        setCourse(data.data.course);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Course not found");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Refetch when status changes to PUBLISHED
  useEffect(() => {
    if (polledStatus === COURSE_STATUS.PUBLISHED) {
      coursesApi.getCourse(id).then(({ data }) => setCourse(data.data.course));
    } else if (polledStatus === COURSE_STATUS.FAILED) {
      setCourse((prev) => prev && { ...prev, status: COURSE_STATUS.FAILED });
    }
  }, [polledStatus, id]);

  const handleExportMd = async () => {
    const { data } = await exportApi.exportMarkdown(id);
    downloadBlob(data, `${course.title}.md`);
  };

  const handleExportPdf = async () => {
    const { data } = await exportApi.exportPdf(id);
    downloadBlob(data, `${course.title}.pdf`);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this course permanently?")) return;
    setDeleting(true);
    try {
      await coursesApi.deleteCourse(id);
      navigate("/dashboard");
    } catch {
      setError("Failed to delete course");
    }
    setDeleting(false);
  };

  if (loading) return <Loader text="Loading course…" />;
  if (error)
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>{error}</h3>
      </div>
    );

  const isGenerating = course.status === COURSE_STATUS.GENERATING;
  const isFailed = course.status === COURSE_STATUS.FAILED;

  return (
    <div className="course-detail">
      {/* Header */}
      <div className="cd-header">
        <div>
          <h1>{course.title}</h1>
          {course.description && (
            <p className="cd-description">{course.description}</p>
          )}
          <div className="cd-meta">
            <span className={`badge badge--${course.status.toLowerCase()}`}>
              {course.status}
            </span>
            <span className={`badge badge--${course.difficulty.toLowerCase()}`}>
              {course.difficulty}
            </span>
            <span className="cd-language">{capitalize(course.language)}</span>
          </div>
        </div>

        <div className="cd-actions">
          {!isGenerating && !isFailed && (
            <>
              <button onClick={handleExportMd} className="btn btn--secondary btn--sm">
                📝 Markdown
              </button>
              <button onClick={handleExportPdf} className="btn btn--secondary btn--sm">
                📄 PDF
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="btn btn--danger btn--sm"
            disabled={deleting}
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Generating state */}
      {isGenerating && (
        <div className="cd-generating card">
          <Loader text="AI is generating your course… this may take a minute" />
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="cd-failed card">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>Generation Failed</h3>
            <p>Something went wrong. Your quota has been refunded.</p>
          </div>
        </div>
      )}

      {/* Modules & Lessons */}
      {!isGenerating && !isFailed && course.modules?.length > 0 && (
        <div className="cd-modules">
          {course.modules.map((mod) => (
            <div key={mod.id} className="module-card card">
              <h2 className="module-title">
                Module {mod.order}: {mod.title}
              </h2>
              <div className="lesson-list">
                {mod.lessons?.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to={`/lessons/${lesson.id}`}
                    className="lesson-item"
                  >
                    <span className="lesson-order">{lesson.order}</span>
                    <span className="lesson-name">
                      {lesson.contents?.[0]?.title || "Untitled Lesson"}
                    </span>
                    <span className="lesson-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
