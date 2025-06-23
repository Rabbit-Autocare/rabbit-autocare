// 'use client'
// import { useEffect, useState } from 'react'
// import { supabase } from '../../lib/supabaseClient'
// import { useRouter } from 'next/navigation'
// import HeroSection from '@/components/home/HeroSection'
// import CategoriesSection from '@/components/home/CategoriesSection'
// import FeaturedProductsSection from '@/components/home/FeaturedProductsSection'
// import WhyChooseUsSection from '@/components/home/WhyChooseUsSection'
// import NewsletterSection from '@/components/home/NewsletterSection'

// export default function Dashboard() {
//   const [featuredProducts, setFeaturedProducts] = useState([])
//   const [loading, setLoading] = useState(true)
//   const router = useRouter()

//   useEffect(() => {
//     async function checkSession() {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession()
//       if (!session) {
//         router.push('/login')
//       }
//     }

//     checkSession()

//     async function fetchFeaturedProducts() {
//       const { data, error } = await supabase
//         .from('products')
//         .select('*')
//         .order('created_at', { ascending: false })
//         .limit(4)

//       if (!error) {
//         setFeaturedProducts(data || [])
//       }
//       setLoading(false)
//     }

//     fetchFeaturedProducts()
//   }, [router])

//   if (loading) return <p>Loading...</p>

//   return (
//     <main>
//       <HeroSection />
//       <CategoriesSection />
//       <FeaturedProductsSection products={featuredProducts} />
//       <WhyChooseUsSection />
//       <NewsletterSection />
//     </main>
//   )
// }
