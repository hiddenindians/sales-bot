import { downloadBlob } from './utils.js'

import client from './client.js'

export const createLabels = async (tier) => {
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

export const generateLabel = (product) => {
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
