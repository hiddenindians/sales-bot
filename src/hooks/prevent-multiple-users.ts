import type { HookContext } from '../declarations'

export const preventMultipleUsers = async (context: HookContext) => {

    if (context.method === 'create') {
  
      const userService = context.app.service('users');
  
      const existingUsers = await userService.find({
  
        query: {
  
          $limit: 1
  
        }
  
      });
  
  
      if (existingUsers.total > 0) {
  
        throw new Error('Only one user account is allowed in the system');
  
      }
  
    }
  
    return context;
  
  };