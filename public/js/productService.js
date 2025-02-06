import client from './client.js'
import { downloadBlob, getDiscountPercentage, addWeeksToDate } from './utils.js'



export const updateProductCheckbox = (field) => async (e) => {
  const enabled = e.target.checked
  await client.service('products').patch(e.target.dataset.id, {
    [field]: enabled
  })
}

export const queryProducts = (queryParams) => {
  return client.service('products').find({ query: queryParams })
}
export const getProductByRetailId = (retailId) => queryProducts({ retail_system_id: Number(retailId) })

export const getProductByEcomIds = (query) => queryProducts(query)
export const getProductsByName = (name) => queryProducts({ name: name })

export const getProductsBySaleTier = (tier, override, limit, skip) => {
  let query = {
    current_sale_tier: tier,
    $limit: limit,
    $skip: skip
  }

  if (override == false) {
    query.override_sale_tier = override
    if (tier == 5) {
      query.exempt_from_clearance = false
    }
    //false means only show safe for sale products, true means show everything
  }

  return queryProducts(query)
}
export const getProductsByDesiredMargin = (margin, override, limit, skip) => {
  let query = {
    desired_margin: margin,
    $limit: limit,
    $skip: skip
  }

  if (override == false) {
    query.override_sale_tier = override
    if (margin == 0.1) {
      query.exempt_from_clearance = false
    }
  }

  return queryProducts(query)
}
export const getAllEcomProducts = () =>
  queryProducts({
    ecom_product_id: { $ne: null },
    $limit: 100000
  })
export const deleteProduct = (id) => {
  client.service('products').remove(id)
}

export const updateSalePrices = async () => {
  const products = await client.service('products').find({
    query: {
      $limit: 100000
    }
  })

  await Promise.all(
    products.data.map(async (product) => {
      let discount = await getDiscountPercentage(
        product.current_sale_tier,
        (product.regular_price - product.cost) / product.regular_price
      )
      let salePrice
      if (discount == 1) {
        salePrice = product.regular_price
      } else {
        salePrice = product.cost / discount
      }
      await patchProduct(product.id, {
        sale_price: salePrice,
        desired_margin: Number((1 - discount).toFixed(2))
      })
    })
  )

  alert('update complete')
}

export const getLabelRemovalCSV = async () => {
  const date = new Date()
  const data = await queryProducts({
    remove_label: true
  })

  var toExport = []

  data.data.map((product) => {
    let labelRemmovalFormat = {
      systemId: product.system_id,
      name: product.name,
      quantity: product.quantity,
      price: product.regular_price.toFixed(2),
      category: product.category
    }

    toExport.push(labelRemmovalFormat)
  })
  let csv = Papa.unparse(toExport)
  downloadBlob(csv, `remove-by-${addWeeksToDate(date, 2)}.csv`, 'text/csv;charset=utf-8')
}

export const patchProduct = async (id, body) => {
    await client.service('products').patch(id, body);
}



