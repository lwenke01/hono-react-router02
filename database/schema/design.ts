import { type InferSelectModel } from 'drizzle-orm'
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { collections } from './collection'
import { shapes } from './shape'

export const designs = sqliteTable('Designs', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  collectionId: integer('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  shapeId: integer('shape_id').references(() => shapes.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  imageUrls: text('image_urls'),
  price: real('price'),
  releaseYear: integer('release_year'),
  categories: text('categories'),
})

export type Design = InferSelectModel<typeof designs>
export const designInsertSchema = createInsertSchema(designs)
