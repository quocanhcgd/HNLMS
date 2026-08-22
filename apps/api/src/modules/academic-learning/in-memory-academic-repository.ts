import type {
  AcademicClass,
  AcademicModule,
  AcademicRepository,
  AcademicSchedule,
  Course,
  Department,
  Enrollment,
  FileAsset,
  LearningContent,
  LearningContentVersion,
  LibraryResource,
  LibraryResourceVersion,
  Program,
  SavedLibraryResource,
  Student,
} from "./academic-learning.service";

export class InMemoryAcademicRepository implements AcademicRepository {
  departments: Department[] = [];
  programs: Program[] = [];
  courses: Course[] = [];
  modules: AcademicModule[] = [];
  classes: AcademicClass[] = [];
  schedules: AcademicSchedule[] = [];
  students: Student[] = [];
  enrollments: Enrollment[] = [];
  fileAssets: FileAsset[] = [];
  learningContents: LearningContent[] = [];
  learningContentVersions: LearningContentVersion[] = [];
  libraryResources: LibraryResource[] = [];
  libraryResourceVersions: LibraryResourceVersion[] = [];
  savedLibraryResources: SavedLibraryResource[] = [];
}
