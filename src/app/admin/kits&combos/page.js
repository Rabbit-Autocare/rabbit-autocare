'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import '../../../app/globals.css';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search, Trash2, Plus } from 'lucide-react';
import { KitsCombosService } from '@/lib/service/kitsCombosService';
import { ProductService } from '@/lib/service/productService';
import { StockService } from '@/lib/service/stockService';

// Dynamically import the shared form
const KitsCombosForm = dynamic(() =>
  import('@/components/forms/KitsCombosForm')
);

export default function KitsAndCombosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('kits'); // 'kits' or 'combos'
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add-kit', or 'add-combo'
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [itemData, setItemData] = useState({
    name: '',
    description: '',
    image_url: null,
    original_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
  });

  const itemLabel = activeTab === 'kits' ? 'Kit' : 'Combo';

  useEffect(() => {
    fetchItems();
    fetchProducts();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response =
        activeTab === 'kits'
          ? await KitsCombosService.getKits()
          : await KitsCombosService.getCombos();
      setItems(response[activeTab] || []);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log("Fetching products from ProductService...");
      const response = await ProductService.getProducts({});
      let products = response?.success ? response.products : [];
      console.log("Products after ProductService.getProducts (raw):"+ JSON.stringify(products));

      // Collect all unique variant IDs from all products
      const allVariantIds = [];
      products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach(variant => {
            allVariantIds.push(variant.id);
          });
        }
      });
      console.log("All variant IDs to fetch stock for:", allVariantIds);

      // Fetch real-time stock for all collected variant IDs
      const fetchedStocks = await StockService.getMultipleVariantsStock(allVariantIds);
      console.log("Fetched real-time stocks from StockService:", fetchedStocks);

      // Update the stock in the products array with the fetched real-time stock
      const updatedProducts = products.map(product => {
        if (product.variants && product.variants.length > 0) {
          const updatedVariants = product.variants.map(variant => {
            const stock = fetchedStocks[variant.id];
            // Ensure stock is updated, fallback to existing if not found (though it should be)
            return { ...variant, stock: stock !== undefined ? stock : variant.stock };
          });
          return { ...product, variants: updatedVariants };
        }
        return product;
      });

      console.log("Products with updated stock before setting allProducts:", JSON.parse(JSON.stringify(updatedProducts)));
      setAllProducts(updatedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setAllProducts([]);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  };

  const handleAddNew = () => {
    setItemData({
      name: '',
      description: '',
      image_url: null,
      original_price: 0,
      discounted_price: 0,
      discount_percentage: 0,
    });
    setSelectedProducts([]);
    setPreviewImage(null);
    setCurrentView(`add-${activeTab}`);
  };

  const handleCancel = () => setCurrentView('list');

  const handleProductSelect = (product, isSelected) => {
    if (isSelected) {
      // When selecting a product, add it and attempt to auto-select the first in-stock variant
      const productToAdd = { ...product };
      if (productToAdd.variants && productToAdd.variants.length > 0) {
        // Find the first variant with stock > 0
        const inStockVariant = productToAdd.variants.find(v => v.stock > 0);
        productToAdd.selected_variant = inStockVariant || null; // Assign the in-stock variant or null
      } else {
        productToAdd.selected_variant = null;
      }
      productToAdd.quantity = 1; // Default quantity

      setSelectedProducts([
        ...selectedProducts,
        productToAdd,
      ]);
    } else {
      // When deselecting a product, remove it from the array
      const updatedProducts = selectedProducts.filter(
        (p) => p.id !== product.id
      );
      setSelectedProducts(updatedProducts);
      calculatePrices(updatedProducts);
    }
  };

  const handleVariantSelect = (productId, variant, instanceIndex) => {
    const updatedProducts = [...selectedProducts];
    let productFoundCount = 0;

    // Iterate through updatedProducts to find the specific instance by productId and instanceIndex
    for (let i = 0; i < updatedProducts.length; i++) {
      if (updatedProducts[i].id === productId) {
        if (productFoundCount === instanceIndex) {
          updatedProducts[i] = { ...updatedProducts[i], selected_variant: variant };
          break; // Found and updated the specific instance
        }
        productFoundCount++;
      }
    }

    setSelectedProducts(updatedProducts);
    calculatePrices(updatedProducts);
  };

  const handleRemoveProductInstance = (productId, instanceIndexToRemove) => {
    const updatedProducts = [];
    let productCount = 0;

    for (let i = 0; i < selectedProducts.length; i++) {
      if (selectedProducts[i].id === productId) {
        if (productCount === instanceIndexToRemove) {
          // Skip this instance (i.e., don't add it to updatedProducts)
        } else {
          updatedProducts.push(selectedProducts[i]);
        }
        productCount++;
      } else {
        updatedProducts.push(selectedProducts[i]);
      }
    }
    setSelectedProducts(updatedProducts);
    calculatePrices(updatedProducts);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const updatedProducts = selectedProducts.map((p) =>
      p.id === productId ? { ...p, quantity: parseInt(newQuantity) || 1 } : p
    );
    setSelectedProducts(updatedProducts);
    calculatePrices(updatedProducts);
  };

  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    const discounted = itemData.original_price * (1 - discount / 100);
    setItemData((prev) => ({
      ...prev,
      discount_percentage: discount,
      discounted_price: discounted,
    }));
  };

  const calculatePrices = (products) => {
    const total = products.reduce((sum, p) => {
      const price = p.selected_variant?.price || p.price || 0;
      return sum + parseFloat(price) * (p.quantity || 1);
    }, 0);
    const discount = parseFloat(itemData.discount_percentage) || 0;
    const discounted = total * (1 - discount / 100);
    setItemData((prev) => ({
      ...prev,
      original_price: total,
      discounted_price: discounted,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const reader = new FileReader();
      reader.onload = (event) => setPreviewImage(event.target.result);
      reader.readAsDataURL(file);

      const ext = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `${activeTab}-images/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      if (error) throw error;

      setItemData((prev) => ({ ...prev, image_url: filePath }));
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Update the handleSubmit function to work with JSON variants

  const handleSubmit = async (formData) => {
    // First check if all selected products have a variant selected
    const missingVariants = selectedProducts.filter(
      (p) => p.variants?.length > 0 && !p.selected_variant
    );

    if (missingVariants.length > 0) {
      alert(`Please select variants for all products`);
      return;
    }

    if (!formData.name) {
      alert(`Please enter a ${itemLabel} name`);
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setLoading(true);

      // Transform products data for API
      const productsData = selectedProducts.map((p) => ({
        product_id: p.id,
        variant_id: p.selected_variant.id,
        quantity: p.quantity || 1
      }));

      const payload = {
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        original_price: formData.original_price,
        price: formData.price,
        discount_percent: formData.discount_percentage,
        products: productsData
      };

      if (activeTab === 'kits') {
        await KitsCombosService.createKit(payload);
      } else {
        await KitsCombosService.createCombo(payload);
      }

      alert(`${itemLabel} created successfully`);
      setCurrentView('list');
      fetchItems();
    } catch (err) {
      console.error('Submit error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        {currentView === 'list' ? (
          <>
            <div className='flex justify-between items-center mb-4'>
              <h1 className='text-2xl font-bold'>Kits & Combos</h1>
              <button
                onClick={handleAddNew}
                className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2'
              >
                <Plus size={16} />
                Add {itemLabel}
              </button>
            </div>

            <div className='flex items-center gap-6 border-b border-gray-200 mb-4'>
              <button
                className={`pb-3 text-sm font-medium transition ${
                  activeTab === 'kits'
                    ? 'text-black border-b-4 border-[#E5E8EB]'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('kits')}
              >
                Kits
              </button>
              <button
                className={`pb-3 text-sm font-medium transition ${
                  activeTab === 'combos'
                    ? 'text-black border-b-4 border-[#E5E8EB]'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('combos')}
              >
                Combos
              </button>
            </div>

            <div className='mb-6 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-[#777777] w-4 h-4' />
              <input
                type='text'
                placeholder={`Search ${itemLabel}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full text-black bg-gray-100 pl-10 pr-4 py-2 rounded-lg outline-none text-sm'
              />
            </div>

            {loading ? (
              <p className='text-center text-gray-500 py-8'>Loading...</p>
            ) : filteredItems.length === 0 ? (
              <div className='bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500'>
                No {itemLabel}s found.
              </div>
            ) : (
              <div className='bg-white border border-gray-200 rounded-lg overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='border-b text-black'>
                    <tr>
                      <th className='px-5 py-4 text-left font-medium'>Image</th>
                      <th className='px-5 py-4 text-left font-medium'>
                        {itemLabel} Name
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Inventory
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>Price</th>
                      <th className='px-5 py-4 text-center font-medium'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className='hover:bg-gray-50'>
                        <td className='px-5 py-4'>
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={item.name}
                            className='w-10 h-10 object-cover rounded'
                            onError={(e) =>
                              (e.target.src = '/placeholder-image.png')
                            }
                          />
                        </td>
                        <td className='px-5 py-4 font-medium text-gray-800'>
                          {item.name}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          {item.inventory || 'Out of Stock'}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          ₹{item.price}
                        </td>
                        <td className='px-5 py-4 text-center'>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className='text-black hover:text-[#601E8D]'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <KitsCombosForm
            itemLabel={itemLabel}
            itemData={itemData}
            selectedProducts={selectedProducts}
            allProducts={allProducts}
            previewImage={previewImage}
            loading={loading}
            uploading={uploading}
            onCancel={handleCancel}
            onChange={setItemData}
            onImageUpload={handleImageUpload}
            onDiscountChange={handleDiscountChange}
            onSubmit={handleSubmit}
            onProductSelect={handleProductSelect}
            onVariantSelect={handleVariantSelect}
            onQuantityChange={handleQuantityChange}
            onRemoveProductInstance={handleRemoveProductInstance}
            getImageUrl={getImageUrl}
          />
        )}
      </div>
    </AdminLayout>
  );
}
