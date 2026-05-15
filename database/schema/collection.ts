import { type InferSelectModel } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'

export const collections = sqliteTable('Collections', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  name: text('name').notNull(),
  description: text('description'),
  season: text('season'),
  series: text('series'),
  edition: text('edition'),
  release_year: integer('release_year'),
  themes: text('themes'),
  colours: text('colours'),
  name_friendly: text('name_friendly'),
  type: text('type'),
  image_urls: text('image_urls'),
  releaseDate: text('releaseDate'),
  exclusive: text('exclusive'),
})

export type Collection = InferSelectModel<typeof collections>
export const collectionInsertSchema = createInsertSchema(collections)
