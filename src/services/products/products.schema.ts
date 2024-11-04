// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ProductsService } from './products.class'

// Main data model schema
export const productsSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String(),
    retail_system_id: Type.Number(),
    ecom_product_id: Type.Optional(Type.Number()),
    ecom_variant_id: Type.Optional(Type.Number()),
    current_sale_tier: Type.Number(),
    last_sale_tier: Type.Number(),
    override_sale_tier: Type.Optional(Type.Boolean()),
    exempt_from_clearance: Type.Optional(Type.Boolean()),

    regular_price: Type.Number(),
    sale_price: Type.Optional(Type.Number()),
    cost: Type.Number(),
    remove_label: Type.Optional(Type.Boolean()),
    create_label: Type.Optional(Type.Boolean()),
    skip_label: Type.Optional(Type.Boolean()),
    single_label: Type.Optional(Type.Boolean()),
    quantity: Type.Number(),
    category: Type.String(),
    desired_margin: Type.Number(),

  },
  { $id: 'Products', additionalProperties: false }
)
export type Products = Static<typeof productsSchema>
export const productsValidator = getValidator(productsSchema, dataValidator)
export const productsResolver = resolve<Products, HookContext<ProductsService>>({})

export const productsExternalResolver = resolve<Products, HookContext<ProductsService>>({})

// Schema for creating new entries
export const productsDataSchema = Type.Pick(productsSchema, [
  'name',
  'retail_system_id',
  'ecom_product_id',
  'ecom_variant_id',
  'current_sale_tier',
  'last_sale_tier',
  'cost',
  'regular_price',
  'sale_price',
  'create_label',
  'remove_label',
  'single_label',
  'skip_label',
  'override_sale_tier',
  'exempt_from_clearance',
  'quantity',
  'category',
  'desired_margin'
], {
  $id: 'ProductsData'
})
export type ProductsData = Static<typeof productsDataSchema>
export const productsDataValidator = getValidator(productsDataSchema, dataValidator)
export const productsDataResolver = resolve<Products, HookContext<ProductsService>>({})

// Schema for updating existing entries
export const productsPatchSchema = Type.Partial(productsSchema, {
  $id: 'ProductsPatch'
})
export type ProductsPatch = Static<typeof productsPatchSchema>
export const productsPatchValidator = getValidator(productsPatchSchema, dataValidator)
export const productsPatchResolver = resolve<Products, HookContext<ProductsService>>({})

// Schema for allowed query properties
export const productsQueryProperties = Type.Pick(productsSchema, [
  'id',
  'name',
  'retail_system_id',
  'ecom_product_id',
  'ecom_variant_id',
  'current_sale_tier',
  'last_sale_tier',
  'create_label',
  'remove_label',  
  'skip_label',
  'quantity',
  'override_sale_tier',
  'exempt_from_clearance',
  'desired_margin'

])
export const productsQuerySchema = Type.Intersect(
  [
    querySyntax(productsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ProductsQuery = Static<typeof productsQuerySchema>
export const productsQueryValidator = getValidator(productsQuerySchema, queryValidator)
export const productsQueryResolver = resolve<ProductsQuery, HookContext<ProductsService>>({})
