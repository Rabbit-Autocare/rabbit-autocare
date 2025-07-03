import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';

/**
 * Server action to verify admin authentication
 * Returns user data if authenticated admin, redirects otherwise
 */
export async function verifyAdminAuth() {
  const supabase = await createSupabaseServerClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      redirect('/login');
    }

    // Fetch user role from auth_users table
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .select('is_admin, id, email')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.is_admin) {
      redirect('/');
    }

    return {
      user: session.user,
      userData,
      isAdmin: userData.is_admin,
    };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    redirect('/login');
  }
}

/**
 * Server action to fetch sales statistics
 */
export async function fetchSalesStats(startDate, endDate) {
  const supabase = await createSupabaseServerClient();

  try {
    const from =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const to = endDate || new Date().toISOString().split('T')[0];

    // Fetch daily sales data
    const { data: dailySales, error: salesError } = await supabase
      .from('sales_records')
      .select('sale_date, total_price, order_number, quantity')
      .gte('sale_date', from)
      .lte('sale_date', to)
      .order('sale_date', { ascending: true });

    if (salesError) throw salesError;

    // Process daily sales data
    const salesByDate = dailySales.reduce((acc, sale) => {
      const date = sale.sale_date;
      acc[date] = (acc[date] || 0) + sale.total_price;
      return acc;
    }, {});

    const processedSales = Object.entries(salesByDate).map(([date, total]) => ({
      sale_date: new Date(date).toLocaleDateString(),
      daily_revenue: total,
    }));

    // Calculate overall stats
    const uniqueOrders = new Set(dailySales.map((sale) => sale.order_number));
    const stats = {
      totalRevenue: dailySales.reduce((sum, sale) => sum + sale.total_price, 0),
      totalOrders: uniqueOrders.size,
      totalProducts: dailySales.reduce((sum, sale) => sum + sale.quantity, 0),
      salesOverTime: processedSales,
    };
    stats.averageOrderValue =
      stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    return stats;
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    throw new Error('Failed to fetch sales statistics');
  }
}

/**
 * Server action to fetch top products
 */
export async function fetchTopProducts(startDate, endDate, limit = 10) {
  const supabase = await createSupabaseServerClient();

  try {
    const from =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const to = endDate || new Date().toISOString().split('T')[0];

    const { data: topProductsData, error: productsError } = await supabase
      .from('sales_records')
      .select('product_name, product_code, total_price, quantity')
      .gte('sale_date', from)
      .lte('sale_date', to)
      .not('parent_item_name', 'is', null) // Exclude kit/combo parent records
      .order('total_price', { ascending: false })
      .limit(limit * 2); // Get more to aggregate properly

    if (productsError) throw productsError;

    const processedProducts = topProductsData
      .reduce((acc, sale) => {
        const existingProduct = acc.find(
          (p) => p.product_code === sale.product_code
        );
        if (existingProduct) {
          existingProduct.total_revenue += sale.total_price;
          existingProduct.total_quantity += sale.quantity;
        } else {
          acc.push({
            product_name: sale.product_name,
            product_code: sale.product_code,
            total_revenue: sale.total_price,
            total_quantity: sale.quantity,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return processedProducts;
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw new Error('Failed to fetch top products');
  }
}

/**
 * Server action to fetch stock overview
 */
export async function fetchStockOverview() {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase.rpc('get_category_stock_overview');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching stock overview:', error, error?.message, error?.stack);
    throw new Error('Failed to fetch stock overview' + (error?.message ? ': ' + error.message : ''));
  }
}

/**
 * Server action to fetch all admin dashboard data
 */
export async function fetchAdminDashboardData(startDate, endDate) {
  try {
    const [salesStats, topProducts] = await Promise.all([
      fetchSalesStats(startDate, endDate),
      fetchTopProducts(startDate, endDate),
      // fetchStockOverview(), // Temporarily disabled
    ]);

    return {
      salesStats,
      topProducts,
      // stockOverview, // Temporarily disabled
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
}
