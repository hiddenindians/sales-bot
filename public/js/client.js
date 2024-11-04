import { productListTemplate } from './templates/product-list.mjs'
import {
  BlobWriter,
  BlobReader,
  HttpReader,
  TextReader,
  ZipWriter
} from 'https://unpkg.com/@zip.js/zip.js/index.js'
//Establish a Socket.io connection
const socket = io()
const client = feathers()

client.configure(feathers.socketio(socket))
client.configure(feathers.authentication())

let selectedTier = document.getElementById('tier-select').value

// Generic function to update product fields
const updateProductCheckbox = (field) => async (e) => {
  const enabled = e.target.checked
  await client.service('products').patch(e.target.dataset.id, {
    [field]: enabled
  })
}

const showProductList = async (tier, limit, skip) => {
  console.log(limit)
  const appElement = document.getElementById('app')

  document.getElementById('app').innerHTML = productListTemplate

  document.getElementById('table-head').innerHTML += `
    <th scope='col' class='px-6 py-3'>Product</th>
    <th scope='col' class='px-6 py-3'>Single Label</th>
    <th scope='col' class='px-6 py-3'>Skip Label</th>
    <th scope='col' class='px-6 py-3'>Exempt from Sale</th>
    <th scope='col' class='px-6 py-3'>Exempt from CLEARANCE</th>
    <th scope='col' class='px-6 py-3'>Cost</th>
    <th scope='col' class='px-6 py-3'>Sale Price</th>
    `

  console.log(limit)
  const data = await getProductsBySaleTier(tier, true, limit, skip)
  if (data.total !== 0) {
    console.log(data)
    data.data.forEach((product) => {
      let highlight = false
      if(product.current_sale_tier != product.last_sale_tier) {
        highlight = true
      }
      document.getElementById('list').innerHTML += `
          <tr class='${highlight ? 'highlight' : ''}'>
            <th scope='row'  >${product.name}</th>
            <td>
              <input id="single-label" data-id="${product.id}" class="toggle toggle-success product-list-checkbox" type="checkbox" ${product.single_label ? 'checked' : ''}>
              <label for="single-label" class="sr-only">checkbox</label>
            </td>
            <td>
              <input id="skip-label" data-id="${product.id}" class="toggle toggle-success product-list-checkbox" type="checkbox" ${product.skip_label ? 'checked' : ''}>
              <label for="skip-label" class="sr-only">checkbox</label>
            </td>
             <td>
              <input id="override-sale" data-id="${product.id}" class="toggle toggle-success product-list-checkbox" type="checkbox" ${product.override_sale_tier ? 'checked' : ''}>
              <label for="override-sale" class="sr-only">checkbox</label>
            </td>
                <td>
              <input id="override-clearance" data-id="${product.id}" class="toggle toggle-success product-list-checkbox" type="checkbox" ${product.exempt_from_clearance ? 'checked' : ''}>
              <label for="override-sale" class="sr-only">checkbox</label>
            </td>
                 <td>
              <input id="cost" data-id="${product.id}" class="input input-sm" type="number" step="0.01" min="0" value="${product.cost ? product.cost.toFixed(2) : 0}">
              <label for="override-sale" class="sr-only">checkbox</label>
            </td>
                 <td>
              <input id="sale_price" data-id="${product.id}" class="input input-sm" type="number" min="0" step="0.01" value="${product.sale_price ? product.sale_price.toFixed(2) : 0}">
              <label for="override-sale" class="sr-only">checkbox</label>
            </td>
          </tr>`
    })
    paginate(data.total, data.limit, data.skip)
  }
}

const paginate = (total, limit, skip) => {
  const currentSpan = document.querySelector('[data-id="paginate-current"]')
  const totalSpan = document.querySelector('[data-id="paginate-total"]')
  const pages = document.getElementById('pagination')
  const numPages = Math.ceil(total / limit)
  const currentPage = Math.floor(skip / limit) + 1

  // Clear previous pagination
  currentSpan.innerHTML = ''
  totalSpan.innerHTML = ''
  pages.innerHTML = ''
  // Update current and total spans
  currentSpan.innerHTML = `${skip + 1} to ${Math.min(skip + limit, total)}`
  totalSpan.innerHTML = `${total}`
  // Add "First" and "Prev" buttons
  if (currentPage > 1) {
    pages.innerHTML += `
      <li>
        <button  data-skip="0" class="paginate-button btn join-item">First</button>
      </li>
      <li>
        <button  data-skip="${(currentPage - 2) * limit}" class="paginate-button btn join-item">Prev</button>
      </li>`
  }
  // Add page number buttons
  for (let i = 1; i <= numPages; i++) {
    if (Math.abs(i - currentPage) < 3 || i < 6 || i > numPages - 5) {
      pages.innerHTML += `
        <li>
          <button data-skip="${(i - 1) * limit}"   class="paginate-button join-item btn ${i === currentPage ? 'btn-active' : ''}">${i}</button>
        </li>`
    }
  }
  // Add "Next" and "Last" buttons
  if (currentPage < numPages) {
    pages.innerHTML += `
      <li>
        <button  data-skip="${currentPage * limit}" class="paginate-button btn join-item">Next</button>
      </li>
      <li>
        <button  data-skip="${(numPages - 1) * limit}" class="paginate-button btn join-item">Last</button>
      </li>`
  }
}

const createLabels = async (tier) => {
  console.log(tier)
  const labels = []

  const data = await client.service('products').find({
    query: {
      create_label: true,
      skip_label: false,
      current_sale_tier: tier,
      override_sale_tier: false,
      $limit: 100000
    }
  })
  console.log(data)
  data.data.forEach((product) => {
    if (product.single_label) {
      labels.push(generateLabel(product))
    } else {
      for (let i = 0; i < product.quantity; i++) {
        labels.push(generateLabel(product))
      }
    }
  })

  const toPrint = labels.join()
  downloadBlob(toPrint, 'labels.zpl', 'text/zpl;charset=utf-8')
}

const generateLabel = (product) => {
  //uses product from DB not from CSV
  //font size needs to adjusted for prices over 999.99
  return `
  ^XA
  ^CI28
  ^GB450,50,1,B,0^FS
  ^FO0,15^A0,35^FB406,1,0,C^FDOn Sale!\\&^FS
  ^FO15,60^A0,25^FB400,4^TBN,400,55^FD${product.name}^FS
  ^A0N,50,50
  ^FO30,125^FD$${product.regular_price.toFixed(2)}^FS
  ^A0N,30
  ^FO30,175^FDReg. Price^FS
  ^A0N,50,50
  ^FO240,125^FD$${product.sale_price.toFixed(2)}^FS
  ^A0N,30
  ^FO240,175^FDSale Price^FS
  ^XZ`
}

const importCSV = async (e) => {
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

const processEcomCSV = async (results) => {
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

const processRetailCSV = async (results) => {
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

const processAnalyticsCSV = async (results) => {
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
            }
          else {
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

// const patchProduct = async (id, product, saleTierFromCSV, calculateSalePrice, additionalFields = {}) => {
//   const productName = 'Item Description'
//   const cost = 'Item Avg Cost'
//   const price = 'Item Metrics Price'
//   const quantity = 'Item Metrics Quantity on Hand'
//   const category = 'Item Category'
//   var salePrice

//   const discountPercentage = await getDiscountPercentage(
//     saleTierFromCSV,
//     (product[price] - product[cost]) / product[price]
//   )

//   if (calculateSalePrice) {
//     salePrice = discountPercentage == 1 ? Number(product[price]) : Number(product[cost] / discountPercentage)
//   } else {
//     salePrice = Number(product[price])
//   }
//   await client.service('products').patch(id, {
//     name: product[productName],
//     category: product[category],
//     regular_price: Number(product[price]),
//     sale_price: salePrice,
//     quantity: Number(product[quantity]),
//     desired_margin: Number((1 - discountPercentage).toFixed(2)),
//     ...additionalFields
//   })
// }
const patchProduct = async (id, product, saleTierFromCSV, calculateSalePrice, additionalFields = {}) => {
  const productName = 'Item Description'
  const cost = 'Item Avg Cost'
  const price = 'Item Metrics Price'
  const quantity = 'Item Metrics Quantity on Hand'
  const category = 'Item Category'
  var salePrice

  const discountPercentage = await getDiscountPercentage(
    saleTierFromCSV,
    (product[price] - product[cost]) / product[price]
  )

  if (calculateSalePrice) {
    salePrice = discountPercentage == 1 ? Number(product[price]) : Number(product[cost] / discountPercentage)
  } else {
    salePrice = Number(product[price])
  }
  
  const patchFields = {
    name: product[productName],
    category: product[category],
    regular_price: Number(product[price]),
    sale_price: salePrice,
    quantity: Number(product[quantity]),
    desired_margin: Number((1 - discountPercentage).toFixed(2)),
    ...additionalFields
  }

  // console.log('Patching product:', id)
  // console.log('Patch fields:', patchFields)

  await client.service('products').patch(id, patchFields)
}

// const handleProductUpdate = async (productFromDB, product, saleTierFromCSV) => {
//   const saleTierFromDB = Number(productFromDB.current_sale_tier)
//   console.log(saleTierFromDB)
//   if (saleTierFromCSV == -1) {
//     //needs manual intervetion
//     await patchProduct(productFromDB.id, product, saleTierFromCSV, false, {
//       current_sale_tier: -1,
//       remove_label: false,
//       create_label: false
//     })
//   } else if (saleTierFromCSV == 0) {
//     //no longer on sale/not on sale
//     if (saleTierFromDB != 0) {
//       //no longer on sale. remove labels
//       await patchProduct(productFromDB.id, product, saleTierFromCSV, false, {
//         current_sale_tier: 0,
//         last_sale_tier: saleTierFromDB,
//         remove_label: true,
//         create_label: false
//       })
//     } else {
//       //was never on sale
//       await patchProduct(productFromDB.id, product, saleTierFromCSV, false, {
//         remove_label: false,
//         create_label: false
//       })
//     }
//   } else if (Number(saleTierFromDB) != Number(saleTierFromCSV)) {
//     //moved tiers

//     await patchProduct(productFromDB.id, product, saleTierFromCSV, true, {
//       current_sale_tier: saleTierFromCSV,
//       last_sale_tier: saleTierFromDB,
//       create_label: true,
//       remove_label: false
//     })
//   } else {
//     //no change from last week. don't need a new label
//     console.log("from db: " +saleTierFromDB + " from csv: " + saleTierFromCSV)
//     await patchProduct(productFromDB.id, product, saleTierFromCSV, true),
//       {
//         remove_label: false,
//         create_label: false,
//         current_sale_tier: saleTierFromCSV,
//         last_sale_tier: saleTierFromDB
//       }
//   }
// }
const handleProductUpdate = async (productFromDB, product, saleTierFromCSV) => {
  const saleTierFromDB = Number(productFromDB.current_sale_tier)


  const additionalFields = {
    remove_label: false,
    create_label: false,
    current_sale_tier: saleTierFromCSV,
    last_sale_tier: saleTierFromDB
  }

  if (saleTierFromCSV == -1) {
    additionalFields.current_sale_tier = -1
  } else if (saleTierFromCSV == 0 && saleTierFromDB != 0) {
    additionalFields.remove_label = true
  } else if (Number(saleTierFromDB) != Number(saleTierFromCSV)) {
    additionalFields.create_label = true
  } 

 // console.log('Additional fields:', additionalFields)

  await patchProduct(productFromDB.id, product, saleTierFromCSV, saleTierFromCSV > 0, additionalFields)
}

const processArchiveCSV = async (results) => {
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

const determineSaleTier = async (product) => {
  const daysSinceSold = Number(product['Item Metrics Days Since Sold'])
  const daysSinceReceived = Number(product['Item Metrics Days Since Received'])
  const productName = product['Item Description']
  const quantity = Number(product['Item Metrics Quantity on Hand'])

  if (quantity <= 0) {
    return 0
  }

  if (
    (daysSinceSold == 0 && daysSinceReceived == 0) ||
    product['Item Category'].includes('Single Cards') ||
    product['Item Avg Cost'] == 0
  ) {
    return -1 //must be determined manually
  }

  // if (productName.includes('CLEARANCE')) {
  //   return 5
  // }



  if (daysSinceSold == 0 || (daysSinceSold - daysSinceReceived) > 60) { //since sold - sincerec > 60 is old item restocked after long time. treat as new item
    console.log(product['Item System ID'])
    //Zero means never sold. doesn't mean sold today
    if (daysSinceReceived < 60) {
      return 0
    } else if (daysSinceReceived >= 60 && daysSinceReceived <= 90) {
      return 1
    } else if (daysSinceReceived >= 91 && daysSinceReceived <= 120) {
      return 2
    } else if (daysSinceReceived >= 121 && daysSinceReceived <= 150) {
      return 3
    } else if (daysSinceReceived >= 151 && daysSinceReceived <= 180) {
      return 4
    } else if (daysSinceReceived >= 181 && productName.includes('CLEARANCE')) {
      return 5
    }
  }

  if ((daysSinceReceived >= 60 && (daysSinceSold - daysSinceReceived) <= 60) || daysSinceReceived == 0) { //sold -rec <= 60 is recently restocked
    if (daysSinceSold < 60) {
      return 0
    } else if (daysSinceSold >= 60 && daysSinceSold <= 90) {
      return 1
    } else if (daysSinceSold >= 91 && daysSinceSold <= 120) {
      return 2
    } else if (daysSinceSold >= 121 && daysSinceSold <= 150) {
      return 3
    } else if (daysSinceSold >= 151 && daysSinceSold <= 180) {
      return 4
    } else if (daysSinceSold >= 181) {
      return 5
    }
  } else {
    return 0
  }
}

const downloadCSV = async (saleTier) => {
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

// const downloadCSVsByMargin = async () => {
//   const zipWriter = new ZipWriter(new BlobWriter('application/zip'), { bufferedWrite: true })
//   var margins = [0.56, 0.48, 0.42, 0.34, 0.26, 0.23, 0.18, 0.16, 0.14, 0.12]
//   var toExport = []
//   var counter = 0

//   margins.map(async (margin) => {
//     await getProductsByDesiredMargin(margin, false, 100000, 0).then(async (data) => {
//       if (data.total > 0) {
//         let csv = Papa.unparse(data.data)
//         toExport.push(csv)
//       }
//     })
//   })

//   const exportPromises = toExport.map((file) => {
//     console.log("File" + file)
//     zipWriter.add(`${counter}.csv`, new BlobReader(file), {})
//     counter++
//   })
//   return Promise.all(exportPromises)
//     .then(() => zipWriter.close())
//     .then((zipBlob) => downloadBlob(zipBlob, `sales-by-margin.zip`, 'application/zip'))
//     .catch(err => console.error(err));
// }
const downloadCSVsByMargin = async () => {
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
const downloadEcomCSV = async () => {
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

const downloadNewClearanceItems = async () => {
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

const downloadBlob = (content, filename, contentType) => {
  var blob = new Blob([content], { type: contentType })
  var url = URL.createObjectURL(blob)
  var pom = document.createElement('a')
  pom.href = url
  pom.setAttribute('download', filename)
  pom.click()
}

const updateSalePrices = async () => {
  const products = await client.service('products').find({
    query: {
      $limit: 100000
    }
  })
  console.log(products)

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
    await client.service('products').patch(product.id, {
      sale_price: salePrice,
      desired_margin: Number((1 - discount).toFixed(2))
    })
  })

  alert('update complete')
}

const getDiscountPercentage = async (saleTier, margin) => {
  var discounts = [1, 0.82, 0.84, 0.86, 0.88, 0.9]
  if (margin >= 0.28) {
    discounts = [1, 0.74, 0.77, 0.82, 0.88, 0.9]
  }
  if (margin >= 0.35) {
    discounts = [1, 0.66, 0.74, 0.82, 0.88, 0.9]
  }
  if (margin >= 0.44) {
    discounts = [1, 0.58, 0.66, 0.77, 0.86, 0.9]
  }
  if (margin >= 0.53) {
    discounts = [1, 0.52, 0.66, 0.77, 0.86, 0.9]
  }
  if (margin >= 0.62) {
    discounts = [1, 0.44, 0.58, 0.74, 0.86, 0.9]
  }
  return discounts[Math.min(Math.max(saleTier, 0), 5)]
}

const queryProducts = (queryParams) => {
  return client.service('products').find({ query: queryParams })
}
const getProductByRetailId = (retailId) => queryProducts({ retail_system_id: Number(retailId) })

const getProductByEcomIds = (query) => queryProducts(query)
const getProductsByName = (name) => queryProducts({ name: name })

const getProductsBySaleTier = (tier, override, limit, skip) => {
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
const getProductsByDesiredMargin = (margin, override, limit, skip) => {
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
const getAllEcomProducts = () =>
  queryProducts({
    ecom_product_id: { $ne: null },
    $limit: 100000
  })

const getLabelRemovalCSV = async () => {
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

const deleteProduct = (id) => {
  client.service('products').remove(id)
}

const addWeeksToDate = (dateObj, numberOfWeeks) => {
  dateObj.setDate(dateObj.getDate() + numberOfWeeks * 7)
  return dateObj
}

const addEventListener = (selector, event, handler) => {
  document.addEventListener(event, async (ev) => {
    if (ev.target.closest(selector)) {
      handler(ev)
    }
  })
}
const eventListeners = [
  {
    selector: '#tier-select',
    event: 'change',
    handler: (e) => {
      selectedTier = e.target.value
      showProductList(selectedTier, 10000, 0)
    }
  },
  { selector: '#import-csv', event: 'change', handler: importCSV },
  { selector: '#update-prices', event: 'click', handler: () => updateSalePrices() },

  { selector: '#tier-download', event: 'click', handler: () => downloadCSV(selectedTier) },
  { selector: '#sale-download', event: 'click', handler: downloadCSVsByMargin },
  { selector: '#ecom-download', event: 'click', handler: downloadEcomCSV },
  { selector: '#new-clearance-download', event: 'click', handler: downloadNewClearanceItems },
  { selector: '#create-labels', event: 'click', handler: () => createLabels(selectedTier) },
  { selector: '#remove-labels', event: 'click', handler: getLabelRemovalCSV },
  { selector: '#single-label', event: 'click', handler: updateProductCheckbox('single_label') },
  { selector: '#skip-label', event: 'click', handler: updateProductCheckbox('skip_label') },
  { selector: '#override-sale', event: 'click', handler: updateProductCheckbox('override_sale_tier') },
  {
    selector: '#override-clearance',
    event: 'click',
    handler: updateProductCheckbox('exempt_from_clearance')
  },
  {
    selector: '.paginate-button',
    event: 'click',
    handler: async (e) => {
      const { skip } = e.target.dataset
      const limit = 100

      showProductList(selectedTier, limit, skip)
    }
  }
]

eventListeners.forEach(({ selector, event, handler }) => {
  addEventListener(selector, event, handler)
})

showProductList(selectedTier, 100, 0)
