import { showProductList } from './uiService.js'
import { importCSV } from './csvService.js'
import { updateSalePrices } from './productService.js'
import {
  downloadCSV,
  downloadCSVsByMargin,
  downloadEcomCSV,
  downloadNewClearanceItems
} from './csvService.js'
import { createLabels } from './labelService.js'
import { getLabelRemovalCSV } from './productService.js'
import { updateProductCheckbox } from './productService.js'
import { handleLogin, handleRegister, toggleForms } from './auth.js';
import { state } from './state.js'

export const eventHandlers = [
  {
    selector: '#login-form', event: 'submit', handler: handleLogin
  },
  {
    selector: '#register-form', event: 'submit', handler: handleRegister
  },
  {
    selector: '#toggle-form', event: 'click', handler: (e) => {
      e.preventDefault();
      toggleForms();
    }
  },
  {
    selector: '#tier-select',
    event: 'change',
    handler: (e) => {
      state.selectedTier = e.target.value
      showProductList(state.selectedTier, 10000, 0)
    }
  },
  { selector: '#import-csv', event: 'change', handler: importCSV },
  { selector: '#update-prices', event: 'click', handler: () => updateSalePrices() },

  { selector: '#tier-download', event: 'click', handler: () => downloadCSV(state.selectedTier) },
  { selector: '#sale-download', event: 'click', handler: downloadCSVsByMargin },
  { selector: '#ecom-download', event: 'click', handler: downloadEcomCSV },
  { selector: '#new-clearance-download', event: 'click', handler: downloadNewClearanceItems },
  { selector: '#create-labels', event: 'click', handler: () => createLabels(state.selectedTier) },
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

      showProductList(state.selectedTier, limit, skip)
    }
  }
]
