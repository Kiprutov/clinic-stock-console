import { ref} from 'vue'
import { useFetch } from './useFetch'

interface Product {
    id: number
    title: string
    category: string
    price: number
    thumbnail: string
    stock: number
}

interface ProductListResponse {
    products: Product[]
    total: number
    skip: number
    limit: number
}

export const PRODUCTS_PER_PAGE = 10
const products = ref<Product[]>([])
const total = ref(0)
const categories = ref<string[]>([])

async function fetchProducts(params: {
    limit: number 
    skip: number
    sortBy?: string 
    order?: 'asc' | 'desc'
    search?: string
    category?: string
}) { 
    const query = new URLSearchParams()
    query.set('limit', String(params.limit))
    query.set('skip', String(params.skip))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.order) query.set('order', params.order)
    
    let url: string
    if (params.category) {
        url = `https://dummyjson.com/products/category/${params.category}?${query}`
    } else if (params.search) {
        query.set('q', params.search)
        url = `https://dummyjson.com/products/search?${query}`
           
    } else {
        url = `https://dummyjson.com/products?${query}`
    }

    const data = await useFetch<ProductListResponse>(url, { key: 'products-list' })

    products.value = data.products
    total.value = data.total
}

async function fetchCategories() {
    const data = await useFetch<{ slug: string; name: string; url: string}[]>(
        'https://dummyjson.com/products/categories'
    )

    categories.value = data.map((c) => c.slug)
}

async function fetchProductsById(id: string | number): Promise<Product> {
   return useFetch<Product>(`https://dummyjson.com/products/${id}`) 
}

function patchProductStock(id: number, newStock: number) {
    const item = products.value.find((p) => p.id === id)
    if (item) {
        item.stock = newStock
    }
}

export function useProductsCache() {
    return {
        products,
        total,
        categories,
        fetchProducts,
        fetchCategories,
        fetchProductsById,
        patchProductStock
    }
}