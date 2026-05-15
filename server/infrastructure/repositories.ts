import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../../database/schema'
import { D1CollectionRepository, D1DesignRepository, D1ShapeRepository } from './todo.repository'

export type Repositories = {
  collectionRepository: D1CollectionRepository
  designRepository: D1DesignRepository
  shapeRepository: D1ShapeRepository
}

export const createRepositories = (db: DrizzleD1Database<typeof schema>): Repositories => {
  return {
    collectionRepository: new D1CollectionRepository(db),
    designRepository: new D1DesignRepository(db),
    shapeRepository: new D1ShapeRepository(db),
  }
}
