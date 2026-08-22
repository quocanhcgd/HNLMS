import type { CommunicationRepository, ParentDelegation, ParentLink } from "./communication.service";

export class InMemoryCommunicationRepository implements CommunicationRepository {
  parentLinks: ParentLink[] = [];
  parentDelegations: ParentDelegation[] = [];
}
