import type { shapes } from '../../database/schema'
import type { Shape } from '../../database/schema/shape'
import type { ShapeRepository } from '../infrastructure/todo.repository'

export class ShapeService {
  constructor(private readonly shapeRepository: ShapeRepository) {}

  async create(shape: typeof shapes.$inferInsert): Promise<Shape> {
    return this.shapeRepository.create(shape)
  }

  async findAll(): Promise<Shape[]> {
    return this.shapeRepository.findAll()
  }

  async delete(id: number): Promise<Shape> {
    return this.shapeRepository.delete(id)
  }
}
