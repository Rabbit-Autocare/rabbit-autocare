import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

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
          upsert: true,
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
      console.log('Fetching kits from Supabase...');

      let query = supabase
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
        query = query.eq('id', id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error fetching kits:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} kits from Supabase`);

      return (data || []).map(kit => ({
        ...kit,
        image_url: kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`,
        main_image_url: kit.main_image_url || kit.image_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/products/kits/${kit.id}.jpg`,
      }));
    } catch (error) {
      console.error('Error fetching kits:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  static async createKit(kitData) {
    try {
      const inventory = kitData.inventory || 1;

      const { data: newKit, error: kitError } = await supabase
        .from('kits')
        .insert({
          name: kitData.name,
          description: kitData.description,
          original_price: kitData.original_price,
          price: kitData.price,
          discount_percent: kitData.discount_percentage,
          inventory,
          image_url: kitData.image_url,
          main_image_url: kitData.image_url,
          images: kitData.images || [kitData.image_url].filter(Boolean),
          sku: kitData.sku,
          hsn: kitData.hsn,
        })
        .select()
        .single();

      if (kitError) {
        console.error("Kit insert error:", kitError);
        throw kitError;
      }

      const kitProductsData = kitData.products.map(p => ({
        kit_id: newKit.id,
        product_id: p.id,
        variant_id: p.selected_variant?.id || null,
        quantity: p.quantity || 1,
      }));

      const { error: kitProductsError } = await supabase
        .from('kit_products')
        .insert(kitProductsData);

      if (kitProductsError) {
        console.error("Kit products insert error:", kitProductsError);
        throw kitProductsError;
      }

      return {
        ...newKit,
        image_url: newKit.image_url,
        main_image_url: newKit.main_image_url,
        images: newKit.images,
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
        inventory,
        sku: kitData.sku,
        hsn: kitData.hsn,
      };

      if (kitData.image_url) {
        updateData.image_url = kitData.image_url;
        updateData.main_image_url = kitData.image_url;
      }
      if (kitData.images) {
        updateData.images = kitData.images;
      }

      const { data: existingProducts, error: fetchError } = await supabase
        .from('kit_products')
        .select('*')
        .eq('kit_id', id);

      if (fetchError) throw fetchError;

      const existingMap = new Map(existingProducts.map(p => [p.product_id, p]));

      const incomingMap = new Map(kitData.products.map(p => [p.id, p]));

      const productsToAdd = [];
      const productsToUpdate = [];
      const productIdsToDelete = [];

      for (const [id, incomingProduct] of incomingMap.entries()) {
        if (!existingMap.has(id)) {
          productsToAdd.push(incomingProduct);
        } else {
          const existing = existingMap.get(id);
          if (existing.quantity !== incomingProduct.quantity) {
            productsToUpdate.push({ ...existing, newQuantity: incomingProduct.quantity });
          }
        }
      }

      for (const [id] of existingMap.entries()) {
        if (!incomingMap.has(id)) {
          productIdsToDelete.push(id);
        }
      }

      if (productsToAdd.length > 0) {
        const insertData = productsToAdd.map(p => ({
          kit_id: id,
          product_id: p.id,
          variant_id: p.selected_variant?.id || null,
          quantity: p.quantity || 1,
        }));

        const { error } = await supabase
          .from('kit_products')
          .insert(insertData);
        if (error) throw error;
      }

      for (const p of productsToUpdate) {
        const { error } = await supabase
          .from('kit_products')
          .update({ quantity: p.newQuantity })
          .eq('id', p.id);
        if (error) throw error;
      }

      if (productIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('kit_products')
          .delete()
          .in('product_id', productIdsToDelete)
          .eq('kit_id', id);
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('kits')
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
      console.error('Error updating kit:', error);
      throw error;
    }
  }

  static async deleteKit(id) {
    try {
      const { error: deleteImageError } = await supabase.storage
        .from('product-images')
        .remove([`products/kits/${id}.jpg`]);

      if (deleteImageError) {
        console.warn('Could not delete kit image:', deleteImageError.message);
      }

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
