import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as coursesApi from "../../api/courses.api";
import { useAuth } from "../../hooks/useAuth";
import Loader from "../../components/Loader/Loader";
import { capitalize, formatDate, truncate } from "../../utils/helpers";
import { DIFFICULTY_OPTIONS } from "../../utils/constants";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCourses = useCallback(
    async (cursor = null) => {
      try {
        const params = { limit: 12 };
        if (search) params.q = search;
        if (difficulty) params.difficulty = difficulty;
        if (cursor) params.cursor = cursor;

        const { data } = await coursesApi.searchCourses(params);
        if (cursor) {
          setCourses((prev) => [...prev, ...data.data.courses]);
        } else {
          setCourses(data.data.courses);
        }
        setNextCursor(data.data.nextCursor || null);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Failed to load courses");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, difficulty],
  );

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(() => fetchCourses(), 300);
    return () => clearTimeout(debounce);
  }, [fetchCourses]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchCourses(nextCursor);
  };

  if (loading) return <Loader text="Loading courses…" />;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>My Dashboard</h1>
          <p className="dashboard-welcome">
            Welcome back, <strong>{user?.name}</strong>
          </p>
        </div>
        <Link to="/courses/create" className="btn btn--primary">
          + Create Course
        </Link>
      </div>

      {/* Quota card */}
      {user?.quota && (
        <div className="quota-card card">
          <div className="quota-label">Quota Usage</div>
          <div className="quota-bar">
            <div
              className="quota-fill"
              style={{
                width: `${Math.min((user.quota.used / user.quota.limit) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="quota-numbers">
            {user.quota.used.toLocaleString()} / {user.quota.limit.toLocaleString()} tokens
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="filter-select"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {capitalize(d)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {/* Course grid */}
      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No courses yet</h3>
          <p>Create your first AI-powered course to get started!</p>
        </div>
      ) : (
        <>
          <div className="course-grid">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="course-card card"
              >
                <div className="course-card-header">
                  <span
                    className={`badge badge--${course.status.toLowerCase()}`}
                  >
                    {course.status}
                  </span>
                  <span
                    className={`badge badge--${course.difficulty.toLowerCase()}`}
                  >
                    {course.difficulty}
                  </span>
                </div>
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">
                  {truncate(course.description, 80)}
                </p>
                <div className="course-card-footer">
                  <span>{formatDate(course.createdAt)}</span>
                  <span>{course.language}</span>
                </div>
              </Link>
            ))}
          </div>

          {nextCursor && (
            <div className="load-more">
              <button
                onClick={handleLoadMore}
                className="btn btn--secondary"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
