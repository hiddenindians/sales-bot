// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type { User, UserData, UserPatch, UserQuery } from './users.schema'

export type { User, UserData, UserPatch, UserQuery }

export interface UserParams extends KnexAdapterParams<UserQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class UserService<ServiceParams extends Params = UserParams> extends KnexService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  // Implement single-user creation for individual records
  async create(data: UserData, params?: ServiceParams): Promise<User>
  // Implement single-user creation for bulk operations (arrays)
  async create(data: UserData[], params?: ServiceParams): Promise<User[]>
  // Implementation that handles both cases
  async create(data: UserData | UserData[], params?: ServiceParams): Promise<User | User[]> {
    // Reject bulk creation attempts
    if (Array.isArray(data)) {
      throw new Error('Bulk user creation is not allowed')
    }
    // Check for existing users
    const existingUsers = await super.find({
      query: {
        $limit: 1
      }
    })

    if (existingUsers.total > 0) {
      throw new Error('Only one user account is allowed in the system')
    }

    // Create the single user
    return super.create(data, params)
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'users'
  }
}
