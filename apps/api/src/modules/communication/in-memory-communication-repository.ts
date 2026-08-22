import type {
  CommunicationRepository,
  Conversation,
  ConversationMember,
  Message,
  Notification,
  NotificationDelivery,
  ParentDelegation,
  ParentLink,
} from "./communication.service";

export class InMemoryCommunicationRepository implements CommunicationRepository {
  parentLinks: ParentLink[] = [];
  parentDelegations: ParentDelegation[] = [];
  conversations: Conversation[] = [];
  conversationMembers: ConversationMember[] = [];
  messages: Message[] = [];
  notifications: Notification[] = [];
  notificationDeliveries: NotificationDelivery[] = [];
}
