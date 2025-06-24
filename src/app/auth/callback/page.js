"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const exchange = async () => {
      const code = searchParams.get("code");
      console.log("[Callback] code param:", code);
      if (code) {
        try {
          console.log("[Callback] calling exchangeCodeForSession...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          console.log("[Callback] exchangeCodeForSession result:", { data, error });
          if (error) {
            router.replace("/login?error=auth_failed");
          } else {
            // Force a hard reload to ensure session is picked up
            window.location.replace("/user");
          }
        } catch (err) {
          console.error("[Callback] exchangeCodeForSession threw:", err);
          router.replace("/login?error=exception");
        }
      } else {
        router.replace("/login?error=missing_code");
      }
    };
    exchange();
  }, [router, searchParams]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center p-8 bg-white shadow-md rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Finalizing Login...</h1>
        <p className="text-gray-600">Please wait, we&apos;re confirming your details.</p>
      </div>
    </div>
  );
}
