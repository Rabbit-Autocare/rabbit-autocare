import { supabase } from '@/lib/supabaseClient';

class VariantService {
  // Get all variant types
  async getVariantTypes() {
    try {
      const { data, error } = await supabase
        .from('variant_types')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching variant types:', error);
      throw error;
    }
  }

  // Get variant values for a specific type
  async getVariantValues(typeName) {
    try {
      const { data, error } = await supabase
        .from('variant_values')
        .select(`
          *,
          variant_type:variant_types(name)
        `)
        .eq('variant_type.name', typeName)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching variant values:', error);
      throw error;
    }
  }

  // Get all variant values grouped by type
  async getAllVariantValues() {
    try {
      const { data, error } = await supabase
        .from('variant_values')
        .select(`
          *,
          variant_type:variant_types(name, display_name)
        `)
        .order('variant_type.sort_order, sort_order');

      if (error) throw error;

      // Group values by type
      const groupedValues = data.reduce((acc, value) => {
        const typeName = value.variant_type.name;
        if (!acc[typeName]) {
          acc[typeName] = {
            name: typeName,
            displayName: value.variant_type.display_name,
            values: []
          };
        }
        acc[typeName].values.push({
          id: value.id,
          value: value.value,
          displayValue: value.display_value,
          sortOrder: value.sort_order
        });
        return acc;
      }, {});

      return groupedValues;
    } catch (error) {
      console.error('Error fetching all variant values:', error);
      throw error;
    }
  }

  // Create a new product variant
  async createProductVariant(productId, variantData) {
    try {
      const {
        product_code,
        sku,
        price,
        stock_quantity,
        is_package,
        package_quantity,
        attributes // Array of { variant_type_id, variant_value_id }
      } = variantData;

      // Start a transaction
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          product_code,
          sku,
          price,
          stock_quantity,
          is_package,
          package_quantity,
          is_active: true
        })
        .select()
        .single();

      if (variantError) throw variantError;

      // Add variant attributes
      if (attributes && attributes.length > 0) {
        const { error: attrError } = await supabase
          .from('product_variant_attributes')
          .insert(
            attributes.map(attr => ({
              product_variant_id: variant.id,
              variant_type_id: attr.variant_type_id,
              variant_value_id: attr.variant_value_id
            }))
          );

        if (attrError) throw attrError;
      }

      return variant;
    } catch (error) {
      console.error('Error creating product variant:', error);
      throw error;
    }
  }

  // Update a product variant
  async updateProductVariant(variantId, variantData) {
    try {
      const {
        sku,
        price,
        stock_quantity,
        is_package,
        package_quantity,
        attributes
      } = variantData;

      // Update variant
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .update({
          sku,
          price,
          stock_quantity,
          is_package,
          package_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .select()
        .single();

      if (variantError) throw variantError;

      // Update attributes if provided
      if (attributes) {
        // Delete existing attributes
        await supabase
          .from('product_variant_attributes')
          .delete()
          .eq('product_variant_id', variantId);

        // Insert new attributes
        if (attributes.length > 0) {
          const { error: attrError } = await supabase
            .from('product_variant_attributes')
            .insert(
              attributes.map(attr => ({
                product_variant_id: variantId,
                variant_type_id: attr.variant_type_id,
                variant_value_id: attr.variant_value_id
              }))
            );

          if (attrError) throw attrError;
        }
      }

      return variant;
    } catch (error) {
      console.error('Error updating product variant:', error);
      throw error;
    }
  }

  // Delete a product variant
  async deleteProductVariant(variantId) {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product variant:', error);
      throw error;
    }
  }

  // Get variants for a product
  async getProductVariants(productId) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          attributes:product_variant_attributes(
            variant_type:variant_types(name, display_name),
            variant_value:variant_values(value, display_value)
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('price');

      if (error) throw error;

      // Transform the data to a more usable format
      return data.map(variant => ({
        ...variant,
        attributes: variant.attributes.reduce((acc, attr) => ({
          ...acc,
          [attr.variant_type.name]: {
            type: attr.variant_type.display_name,
            value: attr.variant_value.value,
            displayValue: attr.variant_value.display_value
          }
        }), {})
      }));
    } catch (error) {
      console.error('Error fetching product variants:', error);
      throw error;
    }
  }

  // Get package contents
  async getPackageContents(packageVariantId) {
    try {
      const { data, error } = await supabase
        .from('package_contents')
        .select('*')
        .eq('package_variant_id', packageVariantId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching package contents:', error);
      throw error;
    }
  }

  // Add package contents
  async addPackageContents(contents) {
    try {
      const { data, error } = await supabase
        .from('package_contents')
        .insert(contents)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding package contents:', error);
      throw error;
    }
  }
}

export default new VariantService();
