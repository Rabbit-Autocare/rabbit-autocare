'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import '../../../app/globals.css';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Search,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Package,
  Edit,
} from 'lucide-react';
import React from 'react';
import { ProductService } from '@/lib/service/productService';
import { StockService } from '@/lib/service/stockService';
import { KitService } from '@/lib/service/kitService';
import { ComboService } from '@/lib/service/comboService';

// Dynamically import the shared form
const KitsCombosForm = dynamic(() =>
  import('@/components/forms/KitsCombosForm')
);

// Helper functions from products page
function getVariantFields(variants) {
  const fields = [
    'gsm',
    'size',
    'color',
    'color_hex',
    'quantity',
    'unit',
    'price',
    'stock',
    'compare_at_price',
    'sku',
    'barcode',
    'weight',
    'dimensions',
    'material',
    'care_instructions',
  ];
  // Filter to include fields if the property exists on at least one variant, regardless of its value
  const includedFields = fields.filter((field) =>
    variants.some((v) => Object.prototype.hasOwnProperty.call(v, field))
  );

  // Add logging for debugging
  console.log('getVariantFields - All included variants:', variants);
  console.log('getVariantFields - Identified fields:', includedFields);

  return includedFields;
}

function formatRupee(amount) {
  if (amount === undefined || amount === null) return '';
  return `₹${Number(amount).toFixed(2)}`;
}

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
  const [expandedRows, setExpandedRows] = useState({}); // State for expanded table rows

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
          ? await KitService.getKits()
          : await ComboService.getCombos();

      // Kits and Combos service now return arrays directly
      setItems(response || []);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Fetching products from ProductService...');
      const response = await ProductService.getProducts({});
      let products = response?.success ? response.products : [];
      console.log(
        'Products after ProductService.getProducts (raw):' +
          JSON.stringify(products)
      );

      // Collect all unique variant IDs from all products
      const allVariantIds = [];
      products.forEach((product) => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant) => {
            allVariantIds.push(variant.id);
          });
        }
      });
      console.log('All variant IDs to fetch stock for:', allVariantIds);

      // Fetch real-time stock for all collected variant IDs
      const fetchedStocks = await StockService.getMultipleVariantsStock(
        allVariantIds
      );
      console.log('Fetched real-time stocks from StockService:', fetchedStocks);

      // Update the stock in the products array with the fetched real-time stock
      const updatedProducts = products.map((product) => {
        if (product.variants && product.variants.length > 0) {
          const updatedVariants = product.variants.map((variant) => {
            const stock = fetchedStocks[variant.id];
            // Ensure stock is updated, fallback to existing if not found (though it should be)
            return {
              ...variant,
              stock: stock !== undefined ? stock : variant.stock,
            };
          });
          return { ...product, variants: updatedVariants };
        }
        return product;
      });

      console.log(
        'Products with updated stock before setting allProducts:',
        JSON.parse(JSON.stringify(updatedProducts))
      );
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
        const inStockVariant = productToAdd.variants.find((v) => v.stock > 0);
        productToAdd.selected_variant = inStockVariant || null; // Assign the in-stock variant or null
      } else {
        productToAdd.selected_variant = null;
      }
      productToAdd.quantity = 1; // Default quantity

      setSelectedProducts([...selectedProducts, productToAdd]);
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
          updatedProducts[i] = {
            ...updatedProducts[i],
            selected_variant: variant,
          };
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

      // Create FormData and append the file and type
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `products/${activeTab}`); // 'products/kits' or 'products/combos'

      // Use the /api/upload endpoint which now uses the service role key
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      const publicUrl = data.url;

      // Update the itemData with the new image URL
      setItemData((prev) => ({
        ...prev,
        image_url: publicUrl,
      }));
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      // Ensure image_url from state is passed to formData if available
      const kitOrComboData = {
        ...formData,
        image_url: itemData.image_url, // Ensure the image_url from state is included
        products: selectedProducts, // Attach the selectedProducts from state
        inventory: 1, // Default inventory to 1, as no input for it yet
      };

      console.log('Submitting kit/combo data:', kitOrComboData); // Log 5

      if (formData.id) {
        // Check if it's an update operation
        if (activeTab === 'kits') {
          await KitService.updateKit(formData.id, kitOrComboData);
          alert('Kit updated successfully!');
        } else if (activeTab === 'combos') {
          await ComboService.updateCombo(formData.id, kitOrComboData);
          alert('Combo updated successfully!');
        }
      } else {
        // It's a create operation
        if (activeTab === 'kits') {
          await KitService.createKit(kitOrComboData);
          alert('Kit created successfully!');
        } else if (activeTab === 'combos') {
          await ComboService.createCombo(kitOrComboData);
          alert('Combo created successfully!');
        }
      }

      handleSuccess(); // Refresh the list and go back to list view
    } catch (error) {
      console.error('Error saving item:', error);
      alert(`Failed to save ${itemLabel}: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (activeTab === 'kits') {
        await KitService.deleteKit(id);
      } else if (activeTab === 'combos') {
        await ComboService.deleteCombo(id);
      }
      alert(`${itemLabel} deleted successfully!`);
      fetchItems();
    } catch (error) {
      console.error(`Error deleting ${itemLabel}:`, error);
      alert(`Failed to delete ${itemLabel}: ${error.message}`);
    }
  };

  const handleEdit = (item) => {
    // Set itemData for the form
    setItemData({
      name: item.name || '',
      description: item.description || '',
      image_url: item.image_url || null,
      original_price: item.original_price || 0,
      price: item.price || 0,
      discount_percentage: item.discount_percent || 0,
      id: item.id, // Pass ID for updates
    });

    // Transform included products to selectedProducts format for the form
    const productsForForm =
      (activeTab === 'kits' ? item.kit_products : item.combo_products)?.map(
        (includedProduct) => ({
          id: includedProduct.product.id,
          ...includedProduct.product,
          selected_variant: includedProduct.variant, // The selected_variant is the actual variant object
          quantity: includedProduct.quantity,
        })
      ) || [];
    setSelectedProducts(productsForForm);

    // Set preview image if available
    if (item.image_url) {
      setPreviewImage(getImageUrl(item.image_url));
    } else {
      setPreviewImage(null);
    }

    setCurrentView('edit');
  };

  const handleCreate = () => {
    setItemData({
      name: '',
      description: '',
      image_url: null,
      original_price: 0,
      price: 0,
      discount_percentage: 0,
    });
    setSelectedProducts([]);
    setPreviewImage(null);
    setCurrentView(`add-${activeTab}`);
  };

  const handleBack = () => {
    // Clear form states
    setItemData({
      name: '',
      description: '',
      image_url: null,
      original_price: 0,
      price: 0,
      discount_percentage: 0,
    });
    setSelectedProducts([]);
    setPreviewImage(null);
    setCurrentView('list');
  };

  const handleSuccess = async () => {
    await fetchItems(); // Refresh items after save/update
    handleBack(); // Go back to list view and reset form
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <AdminLayout>
      <div className='p-6 max-w-full'>
        {currentView === 'list' ? (
          <>
            <div className='flex justify-between items-center mb-6'>
              <h1 className='text-2xl font-bold'>{itemLabel}s</h1>
              <div className='flex gap-2'>
                <button
                  onClick={handleAddNew}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors'
                >
                  <Plus size={16} />
                  Add {itemLabel}
                </button>
              </div>
            </div>

            {/* Tab switcher */}
            <div className='flex border-b border-gray-200 mb-6'>
              <button
                onClick={() => setActiveTab('kits')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'kits'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Kits
              </button>
              <button
                onClick={() => setActiveTab('combos')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'combos'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Combos
              </button>
            </div>

            {/* Search Bar */}
            <div className='mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
              <div className='flex-1 w-full sm:w-auto'>
                <div className='relative'>
                  <Search
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                    size={20}
                  />
                  <input
                    type='text'
                    placeholder={`Search ${itemLabel}s...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-80'>
                        {itemLabel}
                      </th>
                      <th className='px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                        Original Price
                      </th>
                      <th className='px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                        Discount
                      </th>
                      <th className='px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                        Final Price
                      </th>
                      <th className='px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                        Products Included
                      </th>
                      <th className='px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                        Inventory
                      </th>
                      <th className='px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {loading ? (
                      <tr>
                        <td
                          colSpan='7'
                          className='px-6 py-12 text-center text-gray-500'
                        >
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                          <p className='mt-4'>Loading {itemLabel}s...</p>
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan='7'
                          className='px-6 py-12 text-center text-gray-500'
                        >
                          <Package className='mx-auto h-12 w-12 text-gray-300 mb-4' />
                          <p className='text-lg font-medium'>
                            No {itemLabel}s found
                          </p>
                          <p className='text-sm'>
                            Try adding a new {itemLabel.toLowerCase()} or
                            adjusting your search criteria
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <React.Fragment key={item.id}>
                          <tr className='hover:bg-gray-50 transition-colors'>
                            <td className='px-6 py-4'>
                              <div className='flex items-center gap-4'>
                                <button
                                  onClick={() => toggleRow(item.id)}
                                  className='p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0'
                                >
                                  {expandedRows[item.id] ? (
                                    <ChevronDown className='w-4 h-4 text-gray-600' />
                                  ) : (
                                    <ChevronRight className='w-4 h-4 text-gray-600' />
                                  )}
                                </button>

                                {/* Item Image */}
                                <div className='relative flex-shrink-0'>
                                  <div className='w-16 h-16 rounded-lg overflow-hidden border border-gray-200'>
                                    {item.image_url ? (
                                      <img
                                        src={getImageUrl(item.image_url)}
                                        alt={item.name}
                                        className='w-full h-full object-cover'
                                      />
                                    ) : (
                                      <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
                                        <Package className='w-6 h-6 text-gray-400' />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Item Info */}
                                <div className='min-w-0 flex-1'>
                                  <div className='font-medium text-gray-900 truncate'>
                                    {item.name}
                                  </div>
                                  <div className='text-sm text-gray-500 line-clamp-2'>
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className='px-4 py-4 text-sm text-gray-900'>
                              {formatRupee(item.original_price)}
                            </td>
                            <td className='px-4 py-4 text-sm text-red-600'>
                              {item.discount_percent > 0
                                ? `-${item.discount_percent}%`
                                : '—'}
                            </td>
                            <td className='px-4 py-4 text-sm text-green-600 font-semibold'>
                              {formatRupee(item.price)}
                            </td>
                            <td className='px-4 py-4 text-sm text-gray-900'>
                              <span className='font-medium'>
                                {(activeTab === 'kits'
                                  ? item.kit_products
                                  : item.combo_products
                                )?.length || 0}
                              </span>
                              <span className='text-gray-500 ml-1'>
                                products
                              </span>
                            </td>
                            <td className='px-4 py-4 text-sm text-gray-900'>
                              <span className='font-medium'>
                                {item.inventory}
                              </span>
                            </td>
                            <td className='px-4 py-4 text-sm text-gray-900'>
                              <div className='flex items-center gap-1'>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                                  title='Edit product'
                                >
                                  <Pencil className='w-4 h-4' />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                                  title='Delete product'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row for Products */}
                          {expandedRows[item.id] && (
                            <tr>
                              <td colSpan={7} className='px-0 py-0 bg-gray-50'>
                                <div className='px-6 py-4'>
                                  <h4 className='text-sm font-semibold text-gray-700 mb-3'>
                                    Included Products & Variants
                                  </h4>
                                  <div className='overflow-x-auto'>
                                    {(() => {
                                      const includedProducts =
                                        activeTab === 'kits'
                                          ? item.kit_products
                                          : item.combo_products;
                                      if (
                                        !includedProducts ||
                                        includedProducts.length === 0
                                      ) {
                                        return (
                                          <div className='text-center py-8 text-gray-500'>
                                            <Package className='mx-auto h-8 w-8 text-gray-300 mb-2' />
                                            <p>No products included</p>
                                          </div>
                                        );
                                      }

                                      // Collect all unique variant fields across all included products
                                      const allIncludedVariants =
                                        includedProducts.flatMap((p) =>
                                          p.variant ? [p.variant] : []
                                        );
                                      const fields =
                                        getVariantFields(allIncludedVariants);

                                      // Ensure core fields are always present if variants exist
                                      if (
                                        includedProducts.some(
                                          (p) => p.product?.variants?.length > 0
                                        )
                                      ) {
                                        if (!fields.includes('quantity'))
                                          fields.push('quantity');
                                        if (!fields.includes('unit'))
                                          fields.push('unit');
                                        if (!fields.includes('price'))
                                          fields.push('price');
                                        if (!fields.includes('stock'))
                                          fields.push('stock');
                                      }

                                      return (
                                        <table className='min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden'>
                                          <thead className='bg-white'>
                                            <tr>
                                              <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                Product Name
                                              </th>
                                              {fields.includes('gsm') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  GSM
                                                </th>
                                              )}
                                              {fields.includes('size') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Size
                                                </th>
                                              )}
                                              {fields.includes('color') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Color
                                                </th>
                                              )}
                                              <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                Quantity in {itemLabel}
                                              </th>
                                              {fields.includes('quantity') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Variant Quantity
                                                </th>
                                              )}
                                              {fields.includes('unit') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Unit
                                                </th>
                                              )}
                                              <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                Variant Price
                                              </th>
                                              {fields.includes('stock') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Available Stock
                                                </th>
                                              )}
                                              {fields.includes('sku') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  SKU
                                                </th>
                                              )}
                                              {fields.includes('barcode') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Barcode
                                                </th>
                                              )}
                                              {fields.includes('weight') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Weight
                                                </th>
                                              )}
                                              {fields.includes(
                                                'dimensions'
                                              ) && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Dimensions
                                                </th>
                                              )}
                                              {fields.includes('material') && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Material
                                                </th>
                                              )}
                                              {fields.includes(
                                                'care_instructions'
                                              ) && (
                                                <th className='px-4 py-3 text-left font-medium text-gray-700 border-b'>
                                                  Care Instructions
                                                </th>
                                              )}
                                            </tr>
                                          </thead>
                                          <tbody className='bg-white'>
                                            {includedProducts.map(
                                              (includedProduct, index) => {
                                                const variant =
                                                  includedProduct.variant;
                                                const product =
                                                  includedProduct.product;
                                                const availableStock =
                                                  variant?.stock !== undefined
                                                    ? variant.stock
                                                    : 'N/A';

                                                // Add logging for individual variant data
                                                console.log(
                                                  `Rendering included product ${product?.name} (ID: ${product?.id}) - Variant data:`,
                                                  variant
                                                );

                                                return (
                                                  <tr
                                                    key={includedProduct.id}
                                                    className={
                                                      index % 2 === 0
                                                        ? 'bg-white'
                                                        : 'bg-gray-50'
                                                    }
                                                  >
                                                    <td className='px-4 py-3 border-b border-gray-100 font-medium text-gray-900'>
                                                      <div className='flex items-center gap-3'>
                                                        {product?.main_image_url && (
                                                          <div className='w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0'>
                                                            <img
                                                              src={getImageUrl(
                                                                product.main_image_url
                                                              )}
                                                              alt={product.name}
                                                              className='w-full h-full object-cover'
                                                            />
                                                          </div>
                                                        )}
                                                        <div>
                                                          <div className='font-medium'>
                                                            {product?.name ||
                                                              '—'}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    {fields.includes('gsm') && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.gsm !==
                                                          undefined &&
                                                        variant?.gsm !== null
                                                          ? `${variant.gsm} GSM`
                                                          : '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'size'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.size !==
                                                          undefined &&
                                                        variant?.size !== null
                                                          ? `${variant.size} cm`
                                                          : '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'color'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.color ||
                                                        variant?.color_hex ? (
                                                          <div className='flex items-center gap-2'>
                                                            {variant?.color_hex && (
                                                              <div
                                                                className='w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0'
                                                                style={{
                                                                  backgroundColor:
                                                                    variant.color_hex,
                                                                }}
                                                                title={`Hex: ${variant.color_hex}`}
                                                              />
                                                            )}
                                                            <div className='flex flex-col'>
                                                              {variant?.color && (
                                                                <span className='font-medium text-gray-900 text-sm'>
                                                                  {
                                                                    variant.color
                                                                  }
                                                                </span>
                                                              )}
                                                              {variant?.color_hex && (
                                                                <span className='text-xs text-gray-500 font-mono'>
                                                                  {
                                                                    variant.color_hex
                                                                  }
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          '—'
                                                        )}
                                                      </td>
                                                    )}
                                                    <td className='px-4 py-3 border-b border-gray-100'>
                                                      {includedProduct.quantity ||
                                                        '—'}
                                                    </td>
                                                    {fields.includes(
                                                      'quantity'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.quantity !==
                                                          undefined &&
                                                        variant?.quantity !==
                                                          null
                                                          ? `${
                                                              variant.quantity
                                                            }${
                                                              variant?.unit
                                                                ? ` ${variant.unit}`
                                                                : ''
                                                            }`
                                                          : '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'unit'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.unit || '—'}
                                                      </td>
                                                    )}
                                                    <td className='px-4 py-3 border-b border-gray-100'>
                                                      <div className='flex flex-col'>
                                                        <span className='font-semibold text-green-600'>
                                                          {formatRupee(
                                                            variant?.price
                                                          )}
                                                        </span>
                                                        {variant?.compare_at_price &&
                                                          variant.compare_at_price >
                                                            variant?.price && (
                                                            <span className='text-xs text-gray-500 line-through'>
                                                              {formatRupee(
                                                                variant.compare_at_price
                                                              )}
                                                            </span>
                                                          )}
                                                      </div>
                                                    </td>
                                                    {fields.includes(
                                                      'stock'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        <span
                                                          className={`font-medium ${
                                                            availableStock > 0
                                                              ? 'text-green-600'
                                                              : 'text-red-600'
                                                          }`}
                                                        >
                                                          {availableStock}
                                                        </span>
                                                      </td>
                                                    )}
                                                    {fields.includes('sku') && (
                                                      <td className='px-4 py-3 border-b border-gray-100 font-mono text-xs'>
                                                        {variant?.sku || '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'barcode'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100 font-mono text-xs'>
                                                        {variant?.barcode ||
                                                          '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'weight'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.weight
                                                          ? `${variant.weight} g`
                                                          : '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'dimensions'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.dimensions ||
                                                          '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'material'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        {variant?.material ||
                                                          '—'}
                                                      </td>
                                                    )}
                                                    {fields.includes(
                                                      'care_instructions'
                                                    ) && (
                                                      <td className='px-4 py-3 border-b border-gray-100'>
                                                        <div className='max-w-xs'>
                                                          {variant?.care_instructions ? (
                                                            <div className='text-xs text-gray-600'>
                                                              {
                                                                variant.care_instructions
                                                              }
                                                            </div>
                                                          ) : (
                                                            '—'
                                                          )}
                                                        </div>
                                                      </td>
                                                    )}
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
