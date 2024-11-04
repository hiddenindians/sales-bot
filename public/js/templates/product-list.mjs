export const productListTemplate = 
`
  <div class="w-4/5  mx-auto">
 <!--<label class="input input-bordered flex items-center gap-2">
  <input type="text" id="search" class="grow" placeholder="Search" />
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" /></svg>
</label> -->
    <table  class='table table-xs table-zebra' >
      <thead id="table-head">
        
      </thead>
      <tbody id="list">
      </tbody>
    </table>
    <nav class="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4" aria-label="Table navigation">
      <span class="text-sm font-normal text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
        Showing 
        <span data-id='paginate-current'class="font-semibold text-white">
          
        </span>
          of 
        <span data-id="paginate-total" class="font-semibold text-white">
        
        </span>
      </span>
      
      <ul id="pagination" class="join inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
        
        
      </ul>
    </nav>
  </div>
`