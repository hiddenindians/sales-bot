// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Products, ProductsData, ProductsPatch, ProductsQuery, ProductsService } from './products.class'

export type { Products, ProductsData, ProductsPatch, ProductsQuery }

export type ProductsClientService = Pick<
  ProductsService<Params<ProductsQuery>>,
  (typeof productsMethods)[number]
>

export const productsPath = 'products'

export const productsMethods: Array<keyof ProductsService> = ['find', 'get', 'create', 'patch', 'remove']

export const productsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(productsPath, connection.service(productsPath), {
    methods: productsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [productsPath]: ProductsClientService
  }
}
