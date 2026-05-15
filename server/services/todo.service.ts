import type { collections } from '../../database/schema'
import type { Collection } from '../../database/schema/collection'
import type { CollectionRepository } from '../infrastructure/todo.repository'

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async create(collection: typeof collections.$inferInsert): Promise<Collection> {
    // Add business logic here (validation, transformation, etc.)
    return this.collectionRepository.create(collection)
  }

  async findAll(): Promise<Collection[]> {
    // Add business logic here (validation, transformation, etc.)
    return this.collectionRepository.findAll()
  }

  async delete(id: number): Promise<Collection> {
    // Add business logic here (validation, transformation, etc.)
    return this.collectionRepository.delete(id)
  }
}
