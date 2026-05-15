import { type InferSelectModel } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'

export const shapes = sqliteTable('Shapes', {
  id: integer('id').primaryKey({ mode: 'autoincrement' }),
  name: text('name').notNull().unique(),
  measurements: text('measurements'),
  category: text('category'),
  name_friendly: text('name_friendly'),
  size: text('size'),
  description: text('description'),
})

export type Shape = InferSelectModel<typeof shapes>
export const shapeInsertSchema = createInsertSchema(shapes)
