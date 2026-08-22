import type {
  AcademicClass,
  AcademicModule,
  AcademicRepository,
  AcademicSchedule,
  Course,
  Department,
  FileAsset,
  LearningContent,
  LearningContentVersion,
  LibraryResource,
  LibraryResourceVersion,
  Program,
} from "./academic-learning.service";

export class InMemoryAcademicRepository implements AcademicRepository {
  departments: Department[] = [];
  programs: Program[] = [];
  courses: Course[] = [];
  modules: AcademicModule[] = [];
  classes: AcademicClass[] = [];
  schedules: AcademicSchedule[] = [];
  fileAssets: FileAsset[] = [];
  learningContents: LearningContent[] = [];
  learningContentVersions: LearningContentVersion[] = [];
  libraryResources: LibraryResource[] = [];
  libraryResourceVersions: LibraryResourceVersion[] = [];
}
