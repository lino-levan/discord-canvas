import { Assignment, Course, listAssignments, listCourses } from "./canvas.ts";

export async function getAssignments() {
  const courses = await listCourses();
  let assignments: (Assignment & { course: Course })[] = [];

  for (const course of courses) {
    assignments = [
      ...assignments,
      ...(await listAssignments(course.id)).map((assignment) => ({
        ...assignment,
        course,
      })),
    ];
  }

  // Remove assignments already due
  const now = new Date();
  assignments = assignments.filter((assignment) =>
    new Date(assignment.due_at) > now
  );

  // Remove assignments due in > 2 week
  const next_week = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  assignments = assignments.filter((assignment) =>
    new Date(assignment.due_at) < next_week
  );

  return assignments;
}
