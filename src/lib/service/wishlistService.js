export class WishlistService {
  static async addToWishlist(product) {
    try {
      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id || product.product_code,
          productName: product.name,
          productImage: product.main_image_url || product.images?.[0],
          price: product.price || product.mrp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to wishlist")
      }

      return { success: true, data }
    } catch (error) {
      console.error("WishlistService.addToWishlist error:", error)
      return { success: false, error: error.message }
    }
  }

  static async removeFromWishlist(productId) {
    try {
      const response = await fetch(`/api/wishlist/remove/${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove from wishlist")
      }

      return { success: true, data }
    } catch (error) {
      console.error("WishlistService.removeFromWishlist error:", error)
      return { success: false, error: error.message }
    }
  }

  static async getWishlist() {
    try {
      const response = await fetch("/api/wishlist")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get wishlist")
      }

      return { success: true, wishlist: data.wishlist }
    } catch (error) {
      console.error("WishlistService.getWishlist error:", error)
      return { success: false, error: error.message }
    }
  }
}
