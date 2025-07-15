"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import AddressForm from "./AddressForm";
import { FaEdit, FaTrash } from "react-icons/fa";
import { MdOutlineHome, MdOutlineWork, MdOutlineLocationOn } from "react-icons/md";
import { useToast } from '@/components/ui/CustomToast.jsx';
import { motion, AnimatePresence } from "framer-motion";

export default function AddressSection({
  userId,
  selectedAddressId,
  setSelectedAddressId,
}) {
  const supabase = createSupabaseBrowserClient();
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error) {
        setAddresses(data);
        if (!selectedAddressId && data.length > 0) {
          const defaultOrFirst = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(defaultOrFirst.id);
        }
      }
    };

    fetchAddresses();
  }, [userId, selectedAddressId, setSelectedAddressId, supabase]);

  const handleAddOrUpdate = (newAddress) => {
    const exists = addresses.some((a) => a.id === newAddress.id);
    const updated = exists
      ? addresses.map((a) => (a.id === newAddress.id ? newAddress : a))
      : [newAddress, ...addresses];

    setAddresses(updated);
    setEditingAddress(null);
    setShowForm(false);
    if (!selectedAddressId) setSelectedAddressId(newAddress.id);
    showToast("Address saved successfully!", { type: 'success' });
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (!error) {
      const filtered = addresses.filter((a) => a.id !== id);
      setAddresses(filtered);
      if (selectedAddressId === id) {
        setSelectedAddressId(filtered[0]?.id || null);
      }
      showToast("Address deleted!", { type: 'success' });
    } else {
      showToast("Failed to delete address", { type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {(showForm || editingAddress) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AddressForm
              editingAddress={editingAddress}
              onSuccess={handleAddOrUpdate}
              onCancel={() => {
                setEditingAddress(null);
                setShowForm(false);
              }}
            />
          </motion.div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Add New Address
          </button>
        )}
      </AnimatePresence>

      {addresses.length === 0 && !showForm ? (
        <p className="text-gray-600 text-sm">No addresses found. Please add one.</p>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`flex items-start gap-4 p-4 border rounded-lg shadow-sm transition-all cursor-pointer ${
                selectedAddressId === address.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="selected_address"
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => setSelectedAddressId(address.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {address.full_name}
                  </span>
                  {address.is_default && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <MdOutlineLocationOn className="text-lg" /> {address.phone}
                </p>
                <p className="text-sm text-gray-600">
                  {address.street}, {address.city}, {address.state} - {address.postal_code}
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  {address.address_type === "home" && <MdOutlineHome />}
                  {address.address_type === "work" && <MdOutlineWork />}
                  Type: {address.address_type}
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingAddress(address);
                      setShowForm(true);
                    }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(address.id);
                    }}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
