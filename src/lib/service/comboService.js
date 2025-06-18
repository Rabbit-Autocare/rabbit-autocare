import { supabase } from '@/lib/supabaseClient';
import { StockService } from './stockService';

export class ComboService {
  static async uploadComboImage(comboId, imageFile) {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${comboId}.${fileExt}`;
      const filePath = `products/combos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading combo image:', error);
      throw error;
    }
  }

  static async getCombos(id = null) {
    try {
      const query = supabase
        .from('combos')
        .select(`
          *,
          combo_products (
            *,
            product:products (*),
            variant:product_variants (*)
          )
        `);

      if (id) {
        query.eq('id', id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform image URLs to use consistent path
      return data.map(combo => ({
        ...combo,
        image_url: combo.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
        main_image_url: combo.main_image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`
      }));
    } catch (error) {
      console.error('Error fetching combos:', error);
      throw error;
    }
  }

  static async createCombo(comboData) {
    try {
      const inventory = comboData.inventory || 1;

      // Create the combo with the image URLs
      const { data: newCombo, error: comboError } = await supabase
        .from('combos')
        .insert({
          name: comboData.name,
          description: comboData.description,
          original_price: comboData.original_price,
          price: comboData.price,
          discount_percent: comboData.discount_percentage,
          inventory: inventory,
          image_url: comboData.image_url,
          main_image_url: comboData.image_url, // Set the first image as main
          images: comboData.images || [comboData.image_url].filter(Boolean) // Store all images
        })
        .select()
        .single();

      if (comboError) throw comboError;

      const comboProductsData = comboData.products.map(p => ({
        combo_id: newCombo.id,
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1
      }));

      const { error: comboProductsError } = await supabase
        .from('combo_products')
        .insert(comboProductsData);

      if (comboProductsError) throw comboProductsError;

      return {
        ...newCombo,
        image_url: comboData.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${newCombo.id}.jpg`,
        main_image_url: comboData.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${newCombo.id}.jpg`,
        images: comboData.images || [comboData.image_url].filter(Boolean)
      };
    } catch (error) {
      console.error('Error creating combo:', error);
      throw error;
    }
  }

  static async updateCombo(id, comboData) {
    try {
      const inventory = comboData.inventory || 1;

      const updateData = {
        name: comboData.name,
        description: comboData.description,
        original_price: comboData.original_price,
        price: comboData.price,
        discount_percent: comboData.discount_percentage,
        inventory: inventory
      };

      // Update image URLs if provided
      if (comboData.image_url) {
        updateData.image_url = comboData.image_url;
        updateData.main_image_url = comboData.image_url;
      }
      if (comboData.images) {
        updateData.images = comboData.images;
      }

      // Get existing combo products
      const { data: existingProducts, error: fetchError } = await supabase
        .from('combo_products')
        .select('*')
        .eq('combo_id', id);

      if (fetchError) throw fetchError;

      // Determine which products to add, update, or delete
      const existingProductIds = existingProducts.map(p => p.id);
      const newProductIds = comboData.products.map(p => p.id);

      const productsToAdd = comboData.products.filter(p => !existingProductIds.includes(p.id));
      const productsToUpdate = existingProducts.filter(p => newProductIds.includes(p.id));
      const productIdsToDelete = existingProductIds.filter(id => !newProductIds.includes(id));

      // Add new products
      if (productsToAdd.length > 0) {
        const newProductsData = productsToAdd.map(p => ({
          combo_id: id,
          product_id: p.id,
          variant_id: p.selected_variant?.id || null,
          quantity: p.quantity || 1
        }));

        const { error: addError } = await supabase
          .from('combo_products')
          .insert(newProductsData);

        if (addError) throw addError;
      }

      // Update existing products
      if (productsToUpdate.length > 0) {
        for (const update of productsToUpdate) {
          const { error } = await supabase
            .from('combo_products')
            .update({ quantity: update.quantity })
            .eq('id', update.id);
          if (error) throw error;
        }
      }

      // Delete removed products
      if (productIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('combo_products')
          .delete()
          .in('id', productIdsToDelete);
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('combos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return {
        ...data,
        image_url: updateData.image_url || data.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${id}.jpg`,
        main_image_url: updateData.main_image_url || data.main_image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${id}.jpg`,
        images: updateData.images || data.images || [data.image_url].filter(Boolean)
      };
    } catch (error) {
      console.error('Error updating combo:', error);
      throw error;
    }
  }

  static async deleteCombo(id) {
    try {
      // Delete the combo image from storage
      const { error: deleteImageError } = await supabase.storage
        .from('product-images')
        .remove([`products/combos/${id}.jpg`]);

      if (deleteImageError) {
        console.error('Error deleting combo image:', deleteImageError);
      }

      // Delete the combo and its related products
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting combo:', error);
      throw error;
    }
  }
}
