"use client";

import { useState, useEffect } from "react";
import variantService from "@/lib/service/variantService";
import { Palette } from "lucide-react";

export default function VariantForm({
  productCode,
  variants = [],
  onChange,
  isPackage = false
}) {
  const [variantTypes, setVariantTypes] = useState([]);
  const [variantValues, setVariantValues] = useState({});
  const [localVariants, setLocalVariants] = useState(variants);
  const [loading, setLoading] = useState(true);
  const [allColors, setAllColors] = useState([]);

  // Fetch variant types and values
  useEffect(() => {
    const fetchVariantData = async () => {
      try {
        setLoading(true);
        const types = await variantService.getVariantTypes();
        setVariantTypes(types);

        const values = await variantService.getAllVariantValues();
        setVariantValues(values);

        const colors = await variantService.getAllColors();
        setAllColors(colors);
      } catch (error) {
        console.error('Error fetching variant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVariantData();
  }, []);

  // Handle variant changes
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...localVariants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    };
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  // Add new variant
  const handleAddVariant = () => {
    const newVariant = {
      product_code: productCode,
      sku: '',
      price: 0,
      stock_quantity: 0,
      is_package: isPackage,
      package_quantity: isPackage ? 1 : null,
      attributes: []
    };
    setLocalVariants([...localVariants, newVariant]);
    onChange([...localVariants, newVariant]);
  };

  // Remove variant
  const handleRemoveVariant = (index) => {
    const updatedVariants = localVariants.filter((_, i) => i !== index);
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  // Handle attribute selection
  const handleAttributeChange = (variantIndex, typeName, valueId) => {
    const updatedVariants = [...localVariants];
    const variant = updatedVariants[variantIndex];

    // Find the variant type ID
    const type = variantTypes.find(t => t.name === typeName);
    if (!type) return;

    // Update or add the attribute
    const existingAttrIndex = variant.attributes.findIndex(
      attr => attr.variant_type_id === type.id
    );

    if (existingAttrIndex >= 0) {
      variant.attributes[existingAttrIndex].variant_value_id = valueId;
    } else {
      variant.attributes.push({
        variant_type_id: type.id,
        variant_value_id: valueId
      });
    }

    // Update SKU based on attributes
    const skuParts = [productCode];
    variant.attributes.forEach(attr => {
      const type = variantTypes.find(t => t.id === attr.variant_type_id);
      const value = variantValues[type.name]?.values.find(
        v => v.id === attr.variant_value_id
      );
      if (value) {
        skuParts.push(value.value);
      }
    });
    variant.sku = skuParts.join('-');

    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  if (loading) {
    return <div>Loading variant data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Product Variants</h3>
        <button
          type="button"
          onClick={handleAddVariant}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Add Variant
        </button>
      </div>

      {localVariants.map((variant, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-medium">Variant {index + 1}</h4>
            <button
              type="button"
              onClick={() => handleRemoveVariant(index)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>

          {/* Basic variant fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={variant.sku}
                onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                className="w-full px-3 py-2 border rounded"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                value={variant.price}
                onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                value={variant.stock_quantity}
                onChange={(e) => handleVariantChange(index, 'stock_quantity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                min="0"
              />
            </div>
            {isPackage && (
              <div>
                <label className="block text-sm font-medium mb-1">Package Quantity</label>
                <input
                  type="number"
                  value={variant.package_quantity}
                  onChange={(e) => handleVariantChange(index, 'package_quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Palette className="inline w-3 h-3 mr-1" />
                Color *
              </label>
              <select
                value={variant.color || ''}
                onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                required
                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select color</option>
                {allColors.map((color) => (
                  <option key={color.id} value={color.color} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      {color.color}
                    </div>
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Variant attributes */}
          <div className="space-y-4">
            <h5 className="font-medium">Attributes</h5>
            <div className="grid grid-cols-2 gap-4">
              {variantTypes.map((type) => (
                <div key={type.id}>
                  <label className="block text-sm font-medium mb-1">
                    {type.display_name}
                  </label>
                  <select
                    value={variant.attributes.find(
                      attr => attr.variant_type_id === type.id
                    )?.variant_value_id || ''}
                    onChange={(e) => handleAttributeChange(index, type.name, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select {type.display_name}</option>
                    {variantValues[type.name]?.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.displayValue}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
