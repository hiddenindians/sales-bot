import { patchProduct } from "./productService"

export const addWeeksToDate = (dateObj, numberOfWeeks) => {
  dateObj.setDate(dateObj.getDate() + numberOfWeeks * 7)
  return dateObj
}

export const downloadBlob = (content, filename, contentType) => {
  var blob = new Blob([content], { type: contentType })
  var url = URL.createObjectURL(blob)
  var pom = document.createElement('a')
  pom.href = url
  pom.setAttribute('download', filename)
  pom.click()
}

export const addEventListener = (selector, event, handler) => {
  document.addEventListener(event, async (ev) => {
    if (ev.target.closest(selector)) {
      handler(ev)
    }
  })
}

export const getDiscountPercentage = async (saleTier, margin) => {
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

export const determineSaleTier = async (product) => {
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

  if (daysSinceSold == 0 || daysSinceSold - daysSinceReceived > 60) {
    //since sold - sincerec > 60 is old item restocked after long time. treat as new item
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

  if ((daysSinceReceived >= 60 && daysSinceSold - daysSinceReceived <= 60) || daysSinceReceived == 0) {
    //sold -rec <= 60 is recently restocked
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


export const handleProductUpdate = async (productFromDB, product, saleTierFromCSV) => {


    const productName = 'Item Description'
    const cost = 'Item Avg Cost'
    const price = 'Item Metrics Price'
    const quantity = 'Item Metrics Quantity on Hand'
    const category = 'Item Category'
    var salePrice
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
  
   // console.log('Additional fields:', additionalFields)
  
  
    await patchProduct(productFromDB.id, patchFields)
  }