async function wFetch(url: string) {
  const req = await fetch(`https://canvas.ucsc.edu/api/v1/${url}`, {
    headers: {
      "Authorization": `Bearer ${Deno.env.get("CANVAS_TOKEN")}`,
    },
  });
  return await req.json();
}

export interface Course {
  id: number;
  name: string;
  account_id: number;
  uuid: string;
  start_at?: number;
  grading_standard_id?: number;
  is_public: boolean;
  created_at: string;
  course_code: string;
  default_view: string;
  root_account_id: number;
  enrollment_term_id: number;
  license: string;
}

export async function listCourses(): Promise<Course[]> {
  return await wFetch("courses?enrollment_state=active");
}

export interface Assignment {
  id: number;
  description: string;
  due_at: string;
  unlock_at: string;
  lock_at: string;

  name: string;
}

export async function listAssignments(course: number): Promise<Assignment[]> {
  return await wFetch(`courses/${course}/assignments`);
}
