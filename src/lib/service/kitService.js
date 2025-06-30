import { supabase } from '@/lib/supabaseClient';
import { StockService } from './stockService';
 
export class KitService {
  static async uploadKitImage(kitId, imageFile) {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${kitId}.${fileExt}`;
      const filePath = `products/kits/${fileName}`;

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
      console.error('Error uploading kit image:', error);
      throw error;
    }
  }

  static async getKits(id = null) {
    try {
      const query = supabase
        .from('kits')
        .select(`
          *,
          kit_products (
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
      return data.map(kit => ({
        ...kit,
        image_url: kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`,
        main_image_url: kit.main_image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`
      }));
    } catch (error) {
      console.error('Error fetching kits:', error);
      throw error;
    }
  }

  static async createKit(kitData) {
    try {
      const inventory = kitData.inventory || 1;

      // Create the kit with the image URLs
      const { data: newKit, error: kitError } = await supabase
        .from('kits')
        .insert({
          name: kitData.name,
          description: kitData.description,
          original_price: kitData.original_price,
          price: kitData.price,
          discount_percent: kitData.discount_percentage,
          inventory: inventory,
          image_url: kitData.image_url,
          main_image_url: kitData.image_url, // Set the first image as main
          images: kitData.images || [kitData.image_url].filter(Boolean) // Store all images
        })
        .select()
        .single();

      if (kitError) throw kitError;

      const kitProductsData = kitData.products.map(p => ({
        kit_id: newKit.id,
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1
      }));

      const { error: kitProductsError } = await supabase
        .from('kit_products')
        .insert(kitProductsData);

      if (kitProductsError) throw kitProductsError;

      return {
        ...newKit,
        image_url: kitData.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${newKit.id}.jpg`,
        main_image_url: kitData.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${newKit.id}.jpg`,
        images: kitData.images || [kitData.image_url].filter(Boolean)
      };
    } catch (error) {
      console.error('Error creating kit:', error);
      throw error;
    }
  }

  static async updateKit(id, kitData) {
    try {
      const inventory = kitData.inventory || 1;

      const updateData = {
        name: kitData.name,
        description: kitData.description,
        original_price: kitData.original_price,
        price: kitData.price,
        discount_percent: kitData.discount_percentage,
        inventory: inventory
      };

      // Update image URLs if provided
      if (kitData.image_url) {
        updateData.image_url = kitData.image_url;
        updateData.main_image_url = kitData.image_url;
      }
      if (kitData.images) {
        updateData.images = kitData.images;
      }

      // Get existing kit products
      const { data: existingProducts, error: fetchError } = await supabase
        .from('kit_products')
        .select('*')
        .eq('kit_id', id);

      if (fetchError) throw fetchError;

      // Determine which products to add, update, or delete
      const existingProductIds = existingProducts.map(p => p.id);
      const newProductIds = kitData.products.map(p => p.id);

      const productsToAdd = kitData.products.filter(p => !existingProductIds.includes(p.id));
      const productsToUpdate = existingProducts.filter(p => newProductIds.includes(p.id));
      const productIdsToDelete = existingProductIds.filter(id => !newProductIds.includes(id));

      // Add new products
      if (productsToAdd.length > 0) {
        const newProductsData = productsToAdd.map(p => ({
          kit_id: id,
          product_id: p.id,
          variant_id: p.selected_variant?.id || null,
          quantity: p.quantity || 1
        }));

        const { error: addError } = await supabase
          .from('kit_products')
          .insert(newProductsData);

        if (addError) throw addError;
      }

      // Update existing products
      if (productsToUpdate.length > 0) {
        for (const update of productsToUpdate) {
          const { error } = await supabase
            .from('kit_products')
            .update({ quantity: update.quantity })
            .eq('id', update.id);
          if (error) throw error;
        }
      }

      // Delete removed products
      if (productIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('kit_products')
          .delete()
          .in('id', productIdsToDelete);
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('kits')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return {
        ...data,
        image_url: updateData.image_url || data.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${id}.jpg`,
        main_image_url: updateData.main_image_url || data.main_image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${id}.jpg`,
        images: updateData.images || data.images || [data.image_url].filter(Boolean)
      };
    } catch (error) {
      console.error('Error updating kit:', error);
      throw error;
    }
  }

  static async deleteKit(id) {
    try {
      // Delete the kit image from storage
      const { error: deleteImageError } = await supabase.storage
        .from('product-images')
        .remove([`products/kits/${id}.jpg`]);

      if (deleteImageError) {
        console.error('Error deleting kit image:', deleteImageError);
      }

      // Delete the kit and its related products
      const { error } = await supabase
        .from('kits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting kit:', error);
      throw error;
    }
  }
}
