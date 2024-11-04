// main.js
import { eventHandlers } from './eventHandlers.js';
import { addEventListener } from './utils.js';
import { showProductList } from './uiService.js';
import { state } from './state.js';

eventHandlers.forEach(({ selector, event, handler }) => {
  addEventListener(selector, event, handler);
});

showProductList(state.selectedTier, 100, 0);