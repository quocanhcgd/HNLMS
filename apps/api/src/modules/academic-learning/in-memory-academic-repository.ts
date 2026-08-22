import type { AcademicRepository } from "./academic-learning.service";
export class InMemoryAcademicRepository implements AcademicRepository {
  departments = [];
  programs = [];
  courses = [];
  modules = [];
  classes = [];
  schedules = [];
}
