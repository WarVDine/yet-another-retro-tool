import { relations } from 'drizzle-orm'
import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer,
  pgEnum,
  primaryKey,
  index
} from 'drizzle-orm/pg-core'

// Enums
export const retroPhaseEnum = pgEnum('retro_phase', [
  'setup',
  'writing', 
  'grouping',
  'voting',
  'discussing'
])

export const participantRoleEnum = pgEnum('participant_role', [
  'facilitator',
  'participant'
])

// Tables
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  facilitatorCode: varchar('facilitator_code', { length: 50 }).notNull().unique(),
  participantCode: varchar('participant_code', { length: 50 }).notNull().unique(),
  currentPhase: retroPhaseEnum('current_phase').notNull().default('setup'),
  maxVotesPerUser: integer('max_votes_per_user').notNull().default(3),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  facilitatorCodeIdx: index('rooms_facilitator_code_idx').on(table.facilitatorCode),
  participantCodeIdx: index('rooms_participant_code_idx').on(table.participantCode),
  activeRoomsIdx: index('rooms_active_idx').on(table.isActive)
}))

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  guestId: varchar('guest_id', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  guestIdIdx: index('users_guest_id_idx').on(table.guestId)
}))

export const roomParticipants = pgTable('room_participants', {
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: participantRoleEnum('role').notNull().default('participant'),
  joinedAt: timestamp('joined_at').notNull().defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.roomId, table.userId] }),
  roomIdIdx: index('room_participants_room_id_idx').on(table.roomId),
  userIdIdx: index('room_participants_user_id_idx').on(table.userId)
}))

export const columns = pgTable('columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'), // hex color
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  roomIdIdx: index('columns_room_id_idx').on(table.roomId),
  sortOrderIdx: index('columns_sort_order_idx').on(table.roomId, table.sortOrder)
}))

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  columnId: uuid('column_id').notNull().references(() => columns.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isAnonymous: boolean('is_anonymous').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  columnIdIdx: index('cards_column_id_idx').on(table.columnId),
  authorIdIdx: index('cards_author_id_idx').on(table.authorId),
  sortOrderIdx: index('cards_sort_order_idx').on(table.columnId, table.sortOrder)
}))

export const cardGroups = pgTable('card_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  columnId: uuid('column_id').notNull().references(() => columns.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  columnIdIdx: index('card_groups_column_id_idx').on(table.columnId),
  sortOrderIdx: index('card_groups_sort_order_idx').on(table.columnId, table.sortOrder)
}))

export const cardGroupMemberships = pgTable('card_group_memberships', {
  cardId: uuid('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').notNull().references(() => cardGroups.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').notNull().defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.cardId, table.groupId] }),
  cardIdIdx: index('card_group_memberships_card_id_idx').on(table.cardId),
  groupIdIdx: index('card_group_memberships_group_id_idx').on(table.groupId)
}))

export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').references(() => cardGroups.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('likes_user_id_idx').on(table.userId),
  cardIdIdx: index('likes_card_id_idx').on(table.cardId),
  groupIdIdx: index('likes_group_id_idx').on(table.groupId),
  userCardIdx: index('likes_user_card_idx').on(table.userId, table.cardId),
  userGroupIdx: index('likes_user_group_idx').on(table.userId, table.groupId)
}))

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(roomParticipants),
  columns: many(columns)
}))

export const usersRelations = relations(users, ({ many }) => ({
  roomParticipations: many(roomParticipants),
  cards: many(cards),
  likes: many(likes)
}))

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(rooms, {
    fields: [roomParticipants.roomId],
    references: [rooms.id]
  }),
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id]
  })
}))

export const columnsRelations = relations(columns, ({ one, many }) => ({
  room: one(rooms, {
    fields: [columns.roomId],
    references: [rooms.id]
  }),
  cards: many(cards),
  cardGroups: many(cardGroups)
}))

export const cardsRelations = relations(cards, ({ one, many }) => ({
  column: one(columns, {
    fields: [cards.columnId],
    references: [columns.id]
  }),
  author: one(users, {
    fields: [cards.authorId],
    references: [users.id]
  }),
  groupMemberships: many(cardGroupMemberships),
  likes: many(likes)
}))

export const cardGroupsRelations = relations(cardGroups, ({ one, many }) => ({
  column: one(columns, {
    fields: [cardGroups.columnId],
    references: [columns.id]
  }),
  cardMemberships: many(cardGroupMemberships),
  likes: many(likes)
}))

export const cardGroupMembershipsRelations = relations(cardGroupMemberships, ({ one }) => ({
  card: one(cards, {
    fields: [cardGroupMemberships.cardId],
    references: [cards.id]
  }),
  group: one(cardGroups, {
    fields: [cardGroupMemberships.groupId],
    references: [cardGroups.id]
  })
}))

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id]
  }),
  card: one(cards, {
    fields: [likes.cardId],
    references: [cards.id]
  }),
  group: one(cardGroups, {
    fields: [likes.groupId],
    references: [cardGroups.id]
  })
}))

// Type exports for use in application
export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type RoomParticipant = typeof roomParticipants.$inferSelect
export type NewRoomParticipant = typeof roomParticipants.$inferInsert
export type Column = typeof columns.$inferSelect
export type NewColumn = typeof columns.$inferInsert
export type Card = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert
export type CardGroup = typeof cardGroups.$inferSelect
export type NewCardGroup = typeof cardGroups.$inferInsert
export type CardGroupMembership = typeof cardGroupMemberships.$inferSelect
export type NewCardGroupMembership = typeof cardGroupMemberships.$inferInsert
export type Like = typeof likes.$inferSelect
export type NewLike = typeof likes.$inferInsert
