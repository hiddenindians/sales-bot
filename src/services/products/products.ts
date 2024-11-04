// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  productsDataValidator,
  productsPatchValidator,
  productsQueryValidator,
  productsResolver,
  productsExternalResolver,
  productsDataResolver,
  productsPatchResolver,
  productsQueryResolver
} from './products.schema'

import type { Application } from '../../declarations'
import { ProductsService, getOptions } from './products.class'
import { productsPath, productsMethods } from './products.shared'

export * from './products.class'
export * from './products.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const products = (app: Application) => {
  // Register our service on the Feathers application
  app.use(productsPath, new ProductsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: productsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(productsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(productsExternalResolver),
        schemaHooks.resolveResult(productsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(productsQueryValidator),
        schemaHooks.resolveQuery(productsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(productsDataValidator),
        schemaHooks.resolveData(productsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(productsPatchValidator),
        schemaHooks.resolveData(productsPatchResolver)
      ],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [productsPath]: ProductsService
  }
}
