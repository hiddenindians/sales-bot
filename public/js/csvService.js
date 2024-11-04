
import { getProductByRetailId, getProductByEcomIds, getProductsByName } from './productService.js'

import { downloadBlob, determineSaleTier, handleProductUpdate } from './utils.js'


export const importCSV = async (e) => {
  const file = e.target.files[0]

  await Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      if (e.target.dataset.type == 'ecom') {
        processEcomCSV(results)
      }

      if (e.target.dataset.type == 'analytics') {
        processAnalyticsCSV(results)
      }

      if (e.target.dataset.type == 'archive') {
        processArchiveCSV(results)
      }
    }
  })
}

export const processEcomCSV = async (results) => {
  const products = results.data
  const productName = 'EN_Title_Long'
  const ecomProductId = 'Internal_ID'
  const ecomVariantId = 'Internal_Variant_ID'

  console.log('ecom')

  await Promise.all(
    products.map(async (product) => {
      try {
        const foundByEComID = await getProductByEcomIds({
          ecom_product_id: Number(product[ecomProductId]),
          ecom_variant_id: Number(product[ecomVariantId].substring(4))
        })

        if (foundByEComID.total == 1) {
          console.log('found by ecomdeets')
          return
        }

        const found = await getProductsByName(product[productName])
        if (found.total == 1) {
          const productFromDB = found.data[0]
          client.service('products').patch(productFromDB.id, {
            ecom_product_id: Number(product[ecomProductId]),
            ecom_variant_id: Number(product[ecomVariantId].substring(4))
          })
        } else if (found.total > 1) {
          let systemId = prompt(
            `More than one product match this ${product[productName]}. Please enter the Retail SystemID for eCom InternalID: ${product[ecomProductId]}.\n\nPossible matches are ${found.data.map((e) => e.retail_system_id + ' ').join('')}`
          )

          await getProductByRetailId(Number(systemId)).then((data) => {
            console.log(data)
            client.service('products').patch(data.data[0].id, {
              ecom_product_id: Number(product[ecomProductId]),
              ecom_variant_id: Number(product[ecomVariantId].substring(4))
            })
          })
        } else if (found.total == 0) {
          console.log(`no match for ${product[productName]}`)
        }
      } catch (error) {
        console.error('Error processing product:', product, error)
      }
    })
  )

  alert('done processing')
}

export const processRetailCSV = async (results) => {
  const batchSize = 100
  const products = results.data
  const retailId = 'System ID'
  const MSRP = 'MSRP'

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (product) => {
        try {
          const found = await getProductByRetailId(product[retailId])
          if (found.total == 1) {
            const productFromDB = found.data[0]

            await client.service('products').patch(productFromDB.id, {
              regular_price: product[MSRP]
            })
          }
        } catch (error) {
          console.error(error)
        }
      })
    )
  }
}

export const processAnalyticsCSV = async (results) => {
  const batchSize = 100
  const products = results.data
  const retailId = 'Item System ID'
  const productName = 'Item Description'
  const cost = 'Item Avg Cost'
  const price = 'Item Metrics Price'
  const quantity = 'Item Metrics Quantity on Hand'
  const category = 'Item Category'
  // let newProductCount = 0

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (product) => {
        try {
          //no price? skip
          if (product[price] == '') {
            return
          }

          // check if it already exists
          const found = await getProductByRetailId(product[retailId])
          if (found.total == 1) {
            //found by retail system id
            const productFromDB = found.data[0]
            const saleTierFromCSV = await determineSaleTier(product)
            await handleProductUpdate(productFromDB, product, saleTierFromCSV)
          } else {
            //new product
            const saleTierFromCSV = await determineSaleTier(product)
            const discountPercentage = await getDiscountPercentage(
              saleTierFromCSV,
              (product[price] - product[cost]) / product[price]
            )
            const salePrice =
              discountPercentage == 1 ? Number(product[price]) : Number(product[cost] / discountPercentage)

            const newProduct = {
              retail_system_id: Number(product[retailId]),
              name: product[productName],
              current_sale_tier: saleTierFromCSV,
              last_sale_tier: 0,
              cost: Number(product[cost]),
              regular_price: Number(product[price]),
              sale_price: salePrice,
              category: product[category],
              create_label: saleTierFromCSV > 0,
              remove_label: false,
              single_label: false,
              skip_label: false,
              override_sale_tier: false,
              exempt_from_clearance: false,
              quantity: Number(product[quantity]),
              desired_margin: Number((1 - discountPercentage).toFixed(2))
            }

            await client.service('products').create(newProduct)
            //newProductCount++
          }
        } catch (error) {
          console.error('Error processing product:', product, error)
        }
      })
    )
  }
  alert('done updating')
}

export const processArchiveCSV = async (results) => {
  const batchSize = 100
  const products = results.data
  const retailId = 'Item System ID'
  const quantity = 'Item Metrics Quantity on Hand'

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (product) => {
        if (product[quantity] == 0) {
          const data = await getProductByRetailId(product[retailId])
          if (data.total == 1) {
            deleteProduct(data.data[0].id)
          }
        }
      })
    )
  }
  alert('finished processing')
}

export const downloadCSV = async (saleTier) => {
  await getProductsBySaleTier(saleTier, false, 10000, 0).then((data) => {
    var toExport = []

    if (saleTier == 5) {
      data.data.map((product) => {
        let clearanceFormat = {
          system_id: product.retail_system_id,
          name: product.name.includes('CLEARANCE') ? product.name : `**CLEARANCE** ${product.name}`,
          category: 'CLEARANCE'
        }

        let categories = product.category.split('/')
        var startIndex = 0
        if (categories[0] == 'CLEARANCE') {
          startIndex = 1
        }
        for (var i = startIndex; i < categories.length; i++) {
          clearanceFormat[`subcategory_${i - startIndex}`] = `${categories[i]}`
        }
        clearanceFormat.msrp = product.regular_price.toFixed(2)
        clearanceFormat.online_price = product.sale_price.toFixed(2)
        clearanceFormat.default_price = product.sale_price.toFixed(2)
        clearanceFormat.quantity = product.quantity
        toExport.push(clearanceFormat)
      })
    } else {
      toExport = data.data
    }
    let csv = Papa.unparse(toExport)
    downloadBlob(csv, `tier-${saleTier}-sales.csv`, 'text/csv;charset=utf-8')
  })
}

export const downloadCSVsByMargin = async () => {
  const zipWriter = new ZipWriter(new BlobWriter('application/zip'), { bufferedWrite: true })
  var margins = [0.56, 0.48, 0.42, 0.34, 0.26, 0.23, 0.18, 0.16, 0.14, 0.12]
  var counter = 0

  // Use a for loop to handle async operations properly
  for (const margin of margins) {
    try {
      const data = await getProductsByDesiredMargin(margin, false, 100000, 0)
      if (data.total > 0) {
        let csv = Papa.unparse(data.data)
        console.log('Adding CSV for margin:', margin)

        // Convert CSV string to Blob
        const csvBlob = new Blob([csv], { type: 'text/csv' })

        // Add CSV blob to the zip
        await zipWriter.add(`${margin}-percent.csv`, new BlobReader(csvBlob), {})
        counter++
      }
    } catch (error) {
      console.error(`Error fetching data for margin ${margin}:`, error)
    }
  }

  // Close the zip file and trigger download
  zipWriter
    .close()
    .then((zipBlob) => downloadBlob(zipBlob, `sales-by-margin.zip`, 'application/zip'))
    .catch((err) => console.error(err))
}
export const downloadEcomCSV = async () => {
  const data = await getAllEcomProducts()
  var toExport = []

  data.data.map((product) => {
    // if (product.override_sale_tier == false) {
    let formattedForEcom = {
      Name: product.name,
      System_ID: product.retail_system_id,
      Internal_ID: product.ecom_product_id,
      Variant_ID: `!ID:${product.ecom_variant_id}`,
      'Old Price': `${product.regular_price.toFixed(2)}`
    }

    if (product.override_sale_tier == true) {
      formattedForEcom['New Price'] = `${product.regular_price.toFixed(2)}`
    } else if (product.current_sale_tier == 5 && product.exempt_from_clearance == true) {
      formattedForEcom['New Price'] = `${product.regular_price.toFixed(2)}`
    } else {
      formattedForEcom['New Price'] = `${product.sale_price.toFixed(2)}`
    }
    toExport.push(formattedForEcom)
    //   }
  })
  let csv = Papa.unparse(toExport)
  downloadBlob(csv, `ecom-sales.csv`, 'text/csv;charset=utf-8')
}

export const downloadNewClearanceItems = async () => {
  const data = await getProductsBySaleTier(5, false, 10000, 0)

  var toExport = []
  console.log(data.data.length)

  data.data.map((product) => {
    if (!product.name.includes('CLEARANCE')) {
      let clearanceFormat = {
        system_id: product.retail_system_id,
        name: `**CLEARANCE** ${product.name}`,
        category: 'CLEARANCE'
      }

      let categories = product.category.split('/')
      var startIndex = 0
      if (categories[0] == 'CLEARANCE') {
        startIndex = 1
      }
      for (var i = startIndex; i < categories.length; i++) {
        clearanceFormat[`subcategory_${i - startIndex}`] = `${categories[i]}`
      }
      clearanceFormat.msrp = product.regular_price.toFixed(2)
      clearanceFormat.online_price = product.sale_price.toFixed(2)
      clearanceFormat.default_price = product.sale_price.toFixed(2)
      clearanceFormat.quantity = product.quantity
      toExport.push(clearanceFormat)
    }
  })

  let csv = Papa.unparse(toExport)
  downloadBlob(csv, `new-clearance-items.csv`, 'text/csv;charset=utf-8')
}
