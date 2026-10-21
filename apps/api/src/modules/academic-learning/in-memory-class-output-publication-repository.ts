import type { ClassOutputPublication, ClassOutputPublicationRepository, ClassOutputRecord } from "./class-output-publication.service";

export class InMemoryClassOutputPublicationRepository implements ClassOutputPublicationRepository {
  readonly outputs: ClassOutputRecord[] = []; readonly publications: ClassOutputPublication[] = [];
  async findOutput(input: { organizationId: string; outputId: string }) { const item = this.outputs.find((x) => x.organizationId === input.organizationId && x.id === input.outputId); return item ? structuredClone(item) : null; }
  async findPublication(input: { organizationId: string; outputId: string }) { const item = this.publications.find((x) => x.organizationId === input.organizationId && x.outputId === input.outputId); return item ? structuredClone(item) : null; }
  async markPublished(input: { organizationId: string; outputId: string; publishedAt: string; publishedByUserId: string }) { const item = this.outputs.find((x) => x.organizationId === input.organizationId && x.id === input.outputId); if (!item) throw new Error("class_output_not_found"); item.status = "published"; item.publishedAt = input.publishedAt; item.publishedByUserId = input.publishedByUserId; return structuredClone(item); }
  async savePublication(input: ClassOutputPublication) { if (this.publications.some((x) => x.organizationId === input.organizationId && x.outputId === input.outputId)) throw new Error("class_output_already_published"); const item = structuredClone(input); this.publications.push(item); return structuredClone(item); }
}
