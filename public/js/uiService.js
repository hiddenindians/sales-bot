import { productListTemplate } from "./templates/product-list.mjs"
import { getProductsBySaleTier } from "./productService.js"

export const showProductList = async (tier, limit, skip) => {
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


  export const paginate = (total, limit, skip) => {
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