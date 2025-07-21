import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import { StockService } from './stockService';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

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
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading combo image:', error);
      throw error;
    }
  }

  static async getCombos(id = null) {
    try {
      console.log('Fetching combos from Supabase...');

      let query = supabase.from('combos').select(`
        *,
        combo_products (
          *,
          product:products (*),
          variant:product_variants (*)
        )
      `);

      if (id) {
        query = query.eq('id', id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error fetching combos:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} combos from Supabase`);

      // Transform image URLs to use consistent path
      const transformedData = (data || []).map((combo) => ({
        ...combo,
        image_url:
          combo.image_url ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
        main_image_url:
          combo.main_image_url ||
          combo.image_url ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching combos:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  static async createCombo(comboData) {
    try {
      const inventory = comboData.inventory || 1;

      const { data: newCombo, error: comboError } = await supabase
        .from('combos')
        .insert({
          name: comboData.name,
          description: comboData.description,
          original_price: comboData.original_price,
          price: comboData.price,
          discount_percent: comboData.discount_percentage,
          inventory,
          image_url: comboData.image_url,
          main_image_url: comboData.image_url,
          images: comboData.images || [comboData.image_url].filter(Boolean),
          sku: comboData.sku,
          hsn: comboData.hsn,
        })
        .select()
        .single();

      if (comboError) throw comboError;

      const comboProductsData = comboData.products.map((p) => ({
        combo_id: newCombo.id,
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1,
      }));

      const { error: comboProductsError } = await supabase
        .from('combo_products')
        .insert(comboProductsData);

      if (comboProductsError) throw comboProductsError;

      return {
        ...newCombo,
        image_url: newCombo.image_url,
        main_image_url: newCombo.main_image_url,
        images: newCombo.images,
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
        inventory,
        sku: comboData.sku,
        sn: comboData.hsn,
      };

      if (comboData.image_url) {
        updateData.image_url = comboData.image_url;
        updateData.main_image_url = comboData.image_url;
      }
      if (comboData.images) {
        updateData.images = comboData.images;
      }

      const { data: existingProducts, error: fetchError } = await supabase
        .from('combo_products')
        .select('*')
        .eq('combo_id', id);

      if (fetchError) throw fetchError;

      const existingMap = new Map(
        existingProducts.map((p) => [p.product_id, p])
      );
      const incomingMap = new Map(comboData.products.map((p) => [p.id, p]));

      const productsToAdd = [];
      const productsToUpdate = [];
      const productIdsToDelete = [];

      for (const [id, incomingProduct] of incomingMap.entries()) {
        if (!existingMap.has(id)) {
          productsToAdd.push(incomingProduct);
        } else {
          const existing = existingMap.get(id);
          if (existing.quantity !== incomingProduct.quantity) {
            productsToUpdate.push({
              ...existing,
              newQuantity: incomingProduct.quantity,
            });
          }
        }
      }

      for (const [id] of existingMap.entries()) {
        if (!incomingMap.has(id)) {
          productIdsToDelete.push(id);
        }
      }

      if (productsToAdd.length > 0) {
        const insertData = productsToAdd.map((p) => ({
          combo_id: id,
          product_id: p.id,
          variant_id: p.selected_variant?.id || null,
          quantity: p.quantity || 1,
        }));

        const { error } = await supabase
          .from('combo_products')
          .insert(insertData);
        if (error) throw error;
      }

      for (const p of productsToUpdate) {
        const { error } = await supabase
          .from('combo_products')
          .update({ quantity: p.newQuantity })
          .eq('id', p.id);
        if (error) throw error;
      }

      if (productIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('combo_products')
          .delete()
          .in('product_id', productIdsToDelete)
          .eq('combo_id', id);
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('combos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        image_url: data.image_url,
        main_image_url: data.main_image_url,
        images: data.images,
      };
    } catch (error) {
      console.error('Error updating combo:', error);
      throw error;
    }
  }

  static async deleteCombo(id) {
    try {
      const { error: deleteImageError } = await supabase.storage
        .from('product-images')
        .remove([`products/combos/${id}.jpg`]);

      if (deleteImageError) {
        console.warn('Could not delete combo image:', deleteImageError.message);
      }

      const { error } = await supabase.from('combos').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting combo:', error);
      throw error;
    }
  }

  static async getCombosForCart() {
    try {
      console.log('Fetching combos for cart...');

      // Use a simpler query first to get basic combo data
      const { data: combos, error } = await supabase
        .from('combos')
        .select(`
          id,
          name,
          description,
          image_url,
          main_image_url,
          original_price,
          price,
          discount_percent,
          inventory,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching combos:', error);
        throw error;
      }

      console.log(`Fetched ${combos?.length || 0} combos for cart`);

      // Transform the data to include proper image URLs and default values
      const transformedCombos = (combos || []).map((combo) => ({
        ...combo,
        image_url:
          combo.image_url ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
        main_image_url:
          combo.main_image_url ||
          combo.image_url ||
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/combos/${combo.id}.jpg`,
        products: [], // Initialize empty products array
        combo_products: [] // Initialize empty combo_products array
      }));

      return transformedCombos;
    } catch (error) {
      console.error('Error fetching combos for cart:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }
}
