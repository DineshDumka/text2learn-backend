import { useState, useEffect, useRef } from "react";
import * as coursesApi from "../api/courses.api";
import { COURSE_STATUS } from "../utils/constants";

/**
 * Poll course generation status every `interval` ms until PUBLISHED or FAILED.
 */
export function useCourseStatus(courseId, interval = 3000) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const { data } = await coursesApi.getCourseStatus(courseId);
        if (cancelled) return;
        setStatus(data.data.status);

        // Stop polling when terminal state reached
        if (
          data.data.status === COURSE_STATUS.PUBLISHED ||
          data.data.status === COURSE_STATUS.FAILED
        ) {
          return;
        }

        timerRef.current = setTimeout(poll, interval);
      } catch (err) {
        if (!cancelled) setError(err);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [courseId, interval]);

  return { status, error };
}
