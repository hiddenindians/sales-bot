import { showProductList } from './uiService.js'



export const eventHandlers = [
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
  