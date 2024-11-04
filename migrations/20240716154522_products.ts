// For more information about this file see https://dove.feathersjs.com/guides/cli/knexfile.html
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary()

    table.string('name')
    table.integer('retail_system_id').unique()
    table.integer('current_sale_tier')
    table.integer('last_sale_tier')
    table.integer('ecom_product_id')
    table.integer('ecom_variant_id').unique()
    table.decimal('regular_price')
    table.decimal('sale_price')
    table.decimal('cost')
    table.integer('quantity')
    table.boolean('create_label')
    table.boolean('remove_label')
    table.boolean('skip_label')
    table.boolean('single_label')
    table.boolean('override_sale_tier')
    table.boolean('exempt_from_clearance')
    table.string('category')
    table.decimal('desired_margin')
  })

  
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('products')
}
