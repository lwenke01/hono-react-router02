import type { designs } from '../../database/schema'
import type { Design } from '../../database/schema/design'
import type { DesignRepository } from '../infrastructure/todo.repository'

export class DesignService {
  constructor(private readonly designRepository: DesignRepository) {}

  async create(design: typeof designs.$inferInsert): Promise<Design> {
    return this.designRepository.create(design)
  }

  async findAll(): Promise<Design[]> {
    return this.designRepository.findAll()
  }

  async delete(id: number): Promise<Design> {
    return this.designRepository.delete(id)
  }
}
