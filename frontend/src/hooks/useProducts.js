import { useProductsContext } from '../context/ProductsContext';

export default function useProducts() {
  const { products } = useProductsContext();
  return products;
}
